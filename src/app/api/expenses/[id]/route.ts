import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.date === "string") data.date = new Date(body.date);
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.description === "string") data.description = body.description;
  if (body.amount != null) data.amount = Number(body.amount);
  if ("vendor" in body) data.vendor = body.vendor || null;
  if ("paymentMethod" in body) data.paymentMethod = body.paymentMethod || null;
  if ("notes" in body) data.notes = body.notes || null;

  const expense = await prisma.expense.update({ where: { id }, data });
  await logActivity({ userId: session.userId, action: "EXPENSE_UPDATED", entityType: "Expense", entityId: id });

  return NextResponse.json({ expense });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const expense = await prisma.expense.delete({ where: { id } });
  await logActivity({
    userId: session.userId,
    action: "EXPENSE_DELETED",
    entityType: "Expense",
    entityId: id,
    details: `${expense.category}: ${expense.description}`,
  });
  return NextResponse.json({ ok: true });
}
