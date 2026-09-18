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

  const data: Record<string, unknown> = {};
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.dueDate === "string") data.dueDate = new Date(body.dueDate);
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.downpayment === "number") data.downpayment = body.downpayment;

  const order = await prisma.order.update({ where: { id }, data });
  await logActivity({ userId: session.userId, action: "ORDER_UPDATED", entityType: "Order", entityId: id });

  return NextResponse.json({ order });
}
