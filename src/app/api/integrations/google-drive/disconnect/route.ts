import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { disconnectDrive } from "@/lib/googleDrive";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await disconnectDrive();
  await logActivity({ userId: session.userId, action: "GOOGLE_DRIVE_DISCONNECTED", entityType: "Integration" });
  return NextResponse.json({ ok: true });
}
