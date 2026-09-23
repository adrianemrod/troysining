import { google } from "googleapis";
import { Readable } from "stream";

// Uploaded files are stored in Google Drive (owned by the business's Google
// account) via a service account that a root folder has been shared with.
// Only active when both env vars below are set — otherwise storage.ts falls
// back to local disk. Each client gets its own subfolder under that root.

function parseServiceAccountJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    // Tolerate a base64-encoded value in case the raw JSON couldn't be pasted cleanly.
  }
  try {
    text = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(text);
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Re-copy the full contents of the downloaded service account key file and paste it as-is."
    );
  }
}

export function isDriveEnabled(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

export function describeDriveError(err: unknown): string {
  if (err && typeof err === "object") {
    const withResponse = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
    const apiMessage = withResponse.response?.data?.error?.message;
    if (apiMessage) return apiMessage;
    if (withResponse.message) return withResponse.message;
  }
  return "Unknown Google Drive error";
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

function rootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
  return id;
}

export async function createClientFolder(name: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name: name.slice(0, 200),
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId()],
    },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Google Drive did not return a folder id");
  return res.data.id;
}

export async function uploadToDrive(opts: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string | null;
}): Promise<{ fileId: string }> {
  const drive = getDrive();
  const parent = opts.folderId || rootFolderId();

  const res = await drive.files.create({
    requestBody: { name: opts.filename, parents: [parent] },
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
