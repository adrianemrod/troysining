import type { NextRequest } from "next/server";

/**
 * The app's public-facing URL, for building absolute links (invite links,
 * password reset links) that get copied/emailed outside the current request.
 *
 * Behind a reverse proxy (Railway, etc.) the incoming request's own origin
 * can resolve to an internal address rather than the public domain, so we
 * prefer an explicitly configured APP_URL and only fall back to the
 * request's origin for local dev where APP_URL is typically unset.
 */
export function getAppUrl(req: NextRequest): string {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return req.nextUrl.origin;
}
