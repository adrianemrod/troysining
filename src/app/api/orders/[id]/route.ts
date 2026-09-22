import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      salesperson: { select: { id: true, name: true, avatarColor: true, email: true } },
      items: { include: { product: true } },
      productionJob: {
        include: {
          assignedStaff: { select: { id: true, name: true, avatarColor: true } },
          statusLogs: { include: { author: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { createdAt: "desc" } },
        },
      },
      delivery: { include: { rider: { select: { id: true, name: true, avatarColor: true } } } },
      files: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.dueDate === "string") data.dueDate = new Date(body.dueDate);
  if (typeof body.status === "string") data.status = body.status;

  type IncomingItem = { productId?: string; customName?: string; unitPrice?: number; quantity: number; specs?: string };

  let totalAmount: number | undefined;
  if (Array.isArray(body.items) && body.items.length > 0) {
    const incomingItems = body.items as IncomingItem[];
    const productIds = incomingItems.filter((i) => i.productId).map((i) => i.productId as string);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = incomingItems.map((i) => {
      const quantity = Math.max(1, Number(i.quantity) || 1);
      if (i.productId) {
        const product = productMap.get(i.productId);
        if (!product) throw new Error("Invalid product in order items");
        const unitPrice = Number(product.unitPrice);
        return { productId: product.id, quantity, unitPrice, specs: i.specs || null, subtotal: unitPrice * quantity };
      }
      const customName = (i.customName || "").trim();
      const unitPrice = Number(i.unitPrice);
      if (!customName || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new Error("Custom items require a name and a valid price");
      }
      return { customName, quantity, unitPrice, specs: i.specs || null, subtotal: unitPrice * quantity };
    });
    totalAmount = items.reduce((sum: number, i: { subtotal: number }) => sum + i.subtotal, 0);
    data.totalAmount = totalAmount;

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.orderItem.createMany({ data: items.map((i: typeof items[number]) => ({ ...i, orderId: id })) }),
    ]);
  }

  const referenceTotal = totalAmount ?? Number(existing.totalAmount);
  if (typeof body.downpayment === "number") {
    data.downpayment = Math.min(Math.max(0, body.downpayment), referenceTotal);
  } else if (totalAmount != null && Number(existing.downpayment) > totalAmount) {
    // Downpayment can't exceed a newly-reduced total.
    data.downpayment = totalAmount;
  }

  const order = await prisma.order.update({ where: { id }, data, include: { items: { include: { product: true } } } });
  await logActivity({ userId: session.userId, action: "ORDER_UPDATED", entityType: "Order", entityId: id });

  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await prisma.order.delete({ where: { id } });
  await logActivity({
    userId: session.userId,
    action: "ORDER_DELETED",
    entityType: "Order",
    entityId: id,
    details: order.orderNumber,
  });

  return NextResponse.json({ ok: true });
}
