import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES", "ENCODER"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.content?.trim()) return NextResponse.json({ error: "Note content is required." }, { status: 400 });

  const note = await prisma.clientNote.create({
    data: { clientId: id, authorId: session.userId, content: body.content.trim() },
    include: { author: { select: { id: true, name: true, avatarColor: true } } },
  });

  return NextResponse.json({ note }, { status: 201 });
}
