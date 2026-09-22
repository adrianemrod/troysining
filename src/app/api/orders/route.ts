import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function nextOrderNumber(): Promise<string> {
  const last = await prisma.order.findFirst({ orderBy: { createdAt: "desc" }, select: { orderNumber: true } });
  const lastNum = last ? parseInt(last.orderNumber.replace("TPS-", ""), 10) : 1000;
  const next = Number.isFinite(lastNum) ? lastNum + 1 : 1001;
  return `TPS-${next}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, unknown> = {};
  if (session.role === "SALES") where.salespersonId = session.userId;

  const orders = await prisma.order.findMany({
    where,
    include: { client: true, salesperson: { select: { name: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.clientId || !body?.dueDate || !Array.isArray(body?.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Client, due date, and at least one item are required." }, { status: 400 });
  }

  type IncomingItem = { productId?: string; customName?: string; unitPrice?: number; quantity: number; specs?: string };
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

  const totalAmount = items.reduce((sum: number, i: { subtotal: number }) => sum + i.subtotal, 0);
  const downpayment = Math.min(Number(body.downpayment) || 0, totalAmount);
  const orderNumber = await nextOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId: body.clientId,
      salespersonId: body.salespersonId || session.userId,
      status: "QUOTED",
      dueDate: new Date(body.dueDate),
      totalAmount,
      downpayment,
      notes: body.notes || null,
      items: { create: items },
    },
    include: { items: { include: { product: true } }, client: true },
  });

  await prisma.client.update({ where: { id: body.clientId }, data: { leadStage: "QUOTED" } });

  await logActivity({
    userId: session.userId,
    action: "ORDER_CREATED",
    entityType: "Order",
    entityId: order.id,
    details: `Created ${order.orderNumber} for ${order.client.name}`,
  });

  return NextResponse.json({ order }, { status: 201 });
}
