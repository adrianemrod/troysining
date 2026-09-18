import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
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
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.description === "string") data.description = body.description || null;
  if (typeof body.unit === "string") data.unit = body.unit;
  if (body.unitPrice != null) data.unitPrice = Number(body.unitPrice);
  if (body.turnaroundDays != null) data.turnaroundDays = Number(body.turnaroundDays);
  if (typeof body.specs === "string") data.specs = body.specs || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const product = await prisma.product.update({ where: { id }, data });
  await logActivity({ userId: session.userId, action: "PRODUCT_UPDATED", entityType: "Product", entityId: id });

  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, archived: true });
  }
  await logActivity({ userId: session.userId, action: "PRODUCT_DELETED", entityType: "Product", entityId: id });
  return NextResponse.json({ ok: true });
}
