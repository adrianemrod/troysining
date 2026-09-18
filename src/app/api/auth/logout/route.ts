import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logActivity({ userId: session.userId, action: "LOGOUT", entityType: "User", entityId: session.userId });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
