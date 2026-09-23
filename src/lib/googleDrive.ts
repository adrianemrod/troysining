import { google } from "googleapis";
import { Readable } from "stream";

// Uploaded files are stored in a single shared Google Drive folder (owned by
// the business's Google account) via a service account that folder has been
// shared with. Only active when both env vars below are set — otherwise
// storage.ts falls back to local disk.

function parseServiceAccountJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    // Tolerate a base64-encoded value in case the raw JSON couldn't be pasted cleanly.
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  }
}

export function isDriveEnabled(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

let driveClient: ReturnType<typeof google.drive> | null = null;

function getDrive() {
  if (driveClient) return driveClient;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  const credentials = parseServiceAccountJson(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

export async function uploadToDrive(opts: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileId: string }> {
  const drive = getDrive();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const res = await drive.files.create({
    requestBody: { name: opts.filename, parents: folderId ? [folderId] : undefined },
    media: { mimeType: opts.mimeType || "application/octet-stream", body: Readable.from(opts.buffer) },
    fields: "id",
  });

  if (!res.data.id) throw new Error("Google Drive upload did not return a file id");
  return { fileId: res.data.id };
}

export async function downloadFromDrive(fileId: string): Promise<{ buffer: Buffer; mimeType: string | null }> {
  const drive = getDrive();
  const [meta, content] = await Promise.all([
    drive.files.get({ fileId, fields: "mimeType" }),
    drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" }),
  ]);
  return { buffer: Buffer.from(content.data as ArrayBuffer), mimeType: meta.data.mimeType ?? null };
}

export async function trashDriveFile(fileId: string): Promise<void> {
  const drive = getDrive();
  try {
    await drive.files.update({ fileId, requestBody: { trashed: true } });
  } catch {
    // already gone; ignore
  }
}
