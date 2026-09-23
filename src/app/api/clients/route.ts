import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import { isDriveEnabled, createClientFolder } from "@/lib/googleDrive";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const stage = searchParams.get("stage");
  const type = searchParams.get("type");

  const where: Prisma.ClientWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { businessName: { contains: q, mode: "insensitive" } },
      { contactNumber: { contains: q, mode: "insensitive" } },
      { fbHandle: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (stage) where.leadStage = stage as Prisma.ClientWhereInput["leadStage"];
  if (type) where.clientType = type as Prisma.ClientWhereInput["clientType"];
  if (session.role === "SALES") where.salesOwnerId = session.userId;

  const clients = await prisma.client.findMany({
    where,
    include: {
      salesOwner: { select: { id: true, name: true, avatarColor: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Client name is required." }, { status: 400 });

  const client = await prisma.client.create({
    data: {
      name: body.name,
      businessName: body.businessName || null,
      contactNumber: body.contactNumber || null,
      fbHandle: body.fbHandle || null,
      email: body.email || null,
      address: body.address || null,
      clientType: body.clientType || "ONE_TIME",
      leadStage: body.leadStage || "NEW_INQUIRY",
      salesOwnerId: body.salesOwnerId || session.userId,
    },
  });

  await logActivity({ userId: session.userId, action: "CLIENT_CREATED", entityType: "Client", entityId: client.id, details: client.name });

  if (await isDriveEnabled()) {
    try {
      const folderId = await createClientFolder(client.businessName || client.name);
      await prisma.client.update({ where: { id: client.id }, data: { driveFolderId: folderId } });
    } catch {
      // Non-fatal: storage.ts creates the folder lazily on first upload if this failed.
    }
  }

  return NextResponse.json({ client }, { status: 201 });
}
