import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const products = await prisma.product.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.category || body?.unitPrice == null) {
    return NextResponse.json({ error: "Name, category, and unit price are required." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description || null,
      unit: body.unit || "piece",
      unitPrice: Number(body.unitPrice),
      turnaroundDays: Number(body.turnaroundDays) || 3,
      specs: body.specs || null,
      isActive: body.isActive ?? true,
    },
  });

  await logActivity({ userId: session.userId, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id, details: product.name });

  return NextResponse.json({ product }, { status: 201 });
}
