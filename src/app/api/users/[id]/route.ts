import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json({ error: "You cannot change your own role or access here." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.role === "string") data.role = body.role;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, avatarColor: true, isActive: true },
  });

  await logActivity({
    userId: session.userId,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: id,
    details: `Updated ${user.email}: ${JSON.stringify(data)}`,
  });

  return NextResponse.json({ user });
}
