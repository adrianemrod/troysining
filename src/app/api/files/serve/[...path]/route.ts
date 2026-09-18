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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path: segments } = await params;
  const relativePath = segments.map((s) => decodeURIComponent(s)).join("/");

  // Guard against path traversal — every segment must be a plain filename/id component.
  if (segments.some((s) => s.includes("..") || s.includes("/"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
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
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
