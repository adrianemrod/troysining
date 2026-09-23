import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { exchangeCodeForConnection, describeDriveError } from "@/lib/googleDrive";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const base = getAppUrl(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", base));
  }

  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(errorParam)}`, base));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/admin/integrations?error=Missing+authorization+code", base));
  }

  const redirectUri = `${base}/api/integrations/google-drive/callback`;
  let email: string | null = null;
  try {
    const result = await exchangeCodeForConnection(code, redirectUri);
    email = result.email;
  } catch (err) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(describeDriveError(err))}`, base));
  }

  await logActivity({ userId: session.userId, action: "GOOGLE_DRIVE_CONNECTED", entityType: "Integration", details: email ?? undefined });

  return NextResponse.redirect(new URL("/admin/integrations?connected=1", base));
}
