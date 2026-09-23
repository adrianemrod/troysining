import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { getAuthUrl, oauthClientConfigured } from "@/lib/googleDrive";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const base = getAppUrl(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", base));
  }
  if (!oauthClientConfigured()) {
    return NextResponse.redirect(new URL("/admin/integrations?error=Google+OAuth+client+is+not+configured", base));
  }

  const redirectUri = `${base}/api/integrations/google-drive/callback`;
  return NextResponse.redirect(getAuthUrl(redirectUri));
}
