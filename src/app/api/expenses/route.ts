import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");

  const where: Prisma.ExpenseWhereInput = {};
  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { vendor: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    include: { recordedBy: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.category || !body?.description || body?.amount == null) {
    return NextResponse.json({ error: "Date, category, description, and amount are required." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      vendor: body.vendor || null,
      paymentMethod: body.paymentMethod || null,
      notes: body.notes || null,
      recordedById: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    action: "EXPENSE_CREATED",
    entityType: "Expense",
    entityId: expense.id,
    details: `${expense.category}: ${expense.description}`,
  });

  return NextResponse.json({ expense }, { status: 201 });
}
