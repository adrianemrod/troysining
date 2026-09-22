import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { absolutePathFor } from "@/lib/storage";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function errorPage(status: number, title: string, message: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Troysining Printing Management System</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .card { max-width: 420px; margin: 24px; padding: 32px; background: #fff; border: 1px solid #e6e9ee; border-radius: 16px; text-align: center; }
  .badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 9999px; background: #fdeae7; color: #d84f3e; font-size: 22px; margin-bottom: 16px; }
  h1 { font-size: 18px; margin: 0 0 8px; color: #16202b; }
  p { font-size: 14px; color: #6b7684; margin: 0; line-height: 1.5; }
  a { color: #e08b2e; text-decoration: none; font-weight: 500; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">!</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 16px;"><a href="/files">&larr; Back to File Organizer</a></p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession();
  if (!session) {
    return errorPage(401, "Sign in required", "You need to be logged in to view this file. Please sign in and try again.");
  }

  const { path: segments } = await params;
  const relativePath = segments.map((s) => decodeURIComponent(s)).join("/");

  // Guard against path traversal — every segment must be a plain filename/id component.
  if (segments.some((s) => s.includes("..") || s.includes("/"))) {
    return errorPage(400, "Invalid file link", "This file link looks malformed. Please try opening it again from the File Organizer.");
  }

  try {
    const fullPath = absolutePathFor(relativePath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return errorPage(
      404,
      "File not found",
      "This file no longer exists on the server — it may have been removed, or lost during a deployment. Try re-uploading it from the client's page."
    );
  }
}
