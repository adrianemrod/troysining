import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local filesystem storage abstraction, organized per client.
// Swap this module's internals for an S3-compatible client later;
// callers only depend on save()/remove()/urlFor().

// Overridable so a host with a persistent volume (e.g. Railway) can mount it
// somewhere other than the app's working directory.
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
}

export async function saveFile(opts: {
  clientId: string;
  originalName: string;
  buffer: Buffer;
}): Promise<{ storedName: string; relativePath: string; url: string }> {
  const clientDir = path.join(STORAGE_ROOT, sanitizeSegment(opts.clientId));
  await mkdir(clientDir, { recursive: true });

  const ext = path.extname(opts.originalName);
  const base = sanitizeSegment(path.basename(opts.originalName, ext));
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${base}${ext}`;
  const fullPath = path.join(clientDir, storedName);

  await writeFile(fullPath, opts.buffer);

  const relativePath = `${sanitizeSegment(opts.clientId)}/${storedName}`;
  return {
    storedName,
    relativePath,
    url: `/api/files/serve/${relativePath}`,
  };
}

export async function removeFile(relativePath: string): Promise<void> {
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  try {
    await unlink(fullPath);
  } catch {
    // already gone; ignore
  }
}

export function absolutePathFor(relativePath: string): string {
  return path.join(STORAGE_ROOT, relativePath);
}
