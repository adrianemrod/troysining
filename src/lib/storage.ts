import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { isDriveEnabled, uploadToDrive, downloadFromDrive, trashDriveFile, createClientFolder } from "@/lib/googleDrive";

// Storage abstraction for uploaded files: Google Drive when a connection has
// been made at /admin/integrations, otherwise local disk. Callers only
// depend on saveFile()/removeFile()/readStoredFile().

// Overridable so a host with a persistent volume (e.g. Railway) can mount it
// somewhere other than the app's working directory.
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
}

// Each client gets its own Drive subfolder. Clients created before Drive was
// configured (or whose folder creation failed at creation time) get one
// lazily here, on first upload.
async function getOrCreateClientFolderId(clientId: string): Promise<string> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { driveFolderId: true, name: true, businessName: true } });
  if (client?.driveFolderId) return client.driveFolderId;

  const label = client?.businessName || client?.name || clientId;
  const folderId = await createClientFolder(label);
  await prisma.client.update({ where: { id: clientId }, data: { driveFolderId: folderId } }).catch(() => {});
  return folderId;
}

export async function saveFile(opts: {
  clientId: string;
  originalName: string;
  buffer: Buffer;
  mimeType?: string;
}): Promise<{ storedName: string; relativePath: string; url: string }> {
  const ext = path.extname(opts.originalName);
  const base = sanitizeSegment(path.basename(opts.originalName, ext));
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${base}${ext}`;

  if (await isDriveEnabled()) {
    const folderId = await getOrCreateClientFolderId(opts.clientId);
    const { fileId } = await uploadToDrive({
      filename: opts.originalName,
      mimeType: opts.mimeType || "application/octet-stream",
      buffer: opts.buffer,
      folderId,
    });
    return { storedName, relativePath: fileId, url: `/api/files/serve/${fileId}` };
  }

  const clientDir = path.join(STORAGE_ROOT, sanitizeSegment(opts.clientId));
  await mkdir(clientDir, { recursive: true });
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
  if (await isDriveEnabled()) {
    await trashDriveFile(relativePath);
    return;
  }
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  try {
    await unlink(fullPath);
  } catch {
    // already gone; ignore
  }
}

export async function readStoredFile(relativePath: string): Promise<{ buffer: Buffer; mimeType: string | null }> {
  if (await isDriveEnabled()) {
    return downloadFromDrive(relativePath);
  }
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  const buffer = await readFile(fullPath);
  return { buffer, mimeType: null };
}
