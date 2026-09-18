import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      salesOwner: { select: { id: true, name: true, avatarColor: true } },
      notes: { include: { author: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const key of ["name", "businessName", "contactNumber", "fbHandle", "email", "address", "clientType", "leadStage", "salesOwnerId"]) {
    if (key in body) data[key] = body[key] || null;
  }

  const client = await prisma.client.update({ where: { id }, data });
  await logActivity({ userId: session.userId, action: "CLIENT_UPDATED", entityType: "Client", entityId: id });

  return NextResponse.json({ client });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.client.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "This client has related orders and cannot be deleted." }, { status: 409 });
  }
  await logActivity({ userId: session.userId, action: "CLIENT_DELETED", entityType: "Client", entityId: id });
  return NextResponse.json({ ok: true });
}
