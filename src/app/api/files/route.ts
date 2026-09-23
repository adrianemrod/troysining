import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import type { FileCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const clientId = form.get("clientId");
  const orderId = form.get("orderId");
  const category = form.get("category");
  const parentFileId = form.get("parentFileId");
  const file = form.get("file");

  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  let version = 1;
  if (typeof parentFileId === "string" && parentFileId) {
    const parent = await prisma.file.findUnique({ where: { id: parentFileId } });
    if (parent) version = parent.version + 1;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile({ clientId, originalName: file.name, buffer, mimeType: file.type });

  const record = await prisma.file.create({
    data: {
      clientId,
      orderId: typeof orderId === "string" && orderId ? orderId : null,
      uploadedById: session.userId,
      filename: file.name,
      url: saved.url,
      mimeType: file.type || null,
      sizeBytes: file.size,
      category: (typeof category === "string" ? category : "OTHER") as FileCategory,
      version,
      parentFileId: typeof parentFileId === "string" && parentFileId ? parentFileId : null,
    },
    include: { uploadedBy: { select: { name: true, avatarColor: true } } },
  });

  await logActivity({ userId: session.userId, action: "FILE_UPLOADED", entityType: "File", entityId: record.id, details: record.filename });

  return NextResponse.json({ file: record }, { status: 201 });
}
