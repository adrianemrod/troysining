import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !name || password.length < 8) {
    return NextResponse.json({ error: "Name and a password of at least 8 characters are required." }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: invite.email, passwordHash, role: invite.role },
  });

  await prisma.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  await logActivity({ userId: user.id, action: "INVITE_ACCEPTED", entityType: "User", entityId: user.id });

  const sessionToken = await createSessionToken({ userId: user.id, name: user.name, email: user.email, role: user.role });
  await setSessionCookie(sessionToken);

  return NextResponse.json({ ok: true });
}
