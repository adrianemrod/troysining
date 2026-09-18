import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true } } },
  });
  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role as Role | undefined;

  if (!email || !role || !Object.values(Role).includes(role)) {
    return NextResponse.json({ error: "A valid email and role are required." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const token = randomBytes(24).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      token,
      invitedById: session.userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await logActivity({
    userId: session.userId,
    action: "INVITE_SENT",
    entityType: "Invite",
    entityId: invite.id,
    details: `Invited ${email} as ${role}`,
  });

  const inviteLink = `${req.nextUrl.origin}/invite/${token}`;
  console.log(`[team invite] ${email} (${role}) -> ${inviteLink}`);

  return NextResponse.json({ invite, inviteLink });
}
