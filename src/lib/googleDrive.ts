import { google } from "googleapis";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";

// Uploaded files are stored in Google Drive, in the business's own Google
// account (troysining2018@gmail.com), connected via OAuth from
// /admin/integrations. A service account can't be used here: Google removed
// storage quota from service accounts in 2021, and the usual workaround
// (Shared Drives / domain-wide delegation) requires a paid Google Workspace
// plan, which a personal Gmail account doesn't have. Signing in as the real
// account is the only way for the app to write into its Drive.
//
// storage.ts falls back to local disk whenever no connection exists.

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/userinfo.email"];
const CONNECTION_ID = "default";
const ROOT_FOLDER_NAME = "Troysining Printing Files";

export function oauthClientConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function newOAuthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth client is not configured (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET)");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(redirectUri: string): string {
  const client = newOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES,
  });
}

export async function exchangeCodeForConnection(code: string, redirectUri: string): Promise<{ email: string | null }> {
  const client = newOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google didn't return a refresh token (it only sends one the first time you approve access). Remove Troysining's access at https://myaccount.google.com/permissions and try connecting again."
    );
  }
  client.setCredentials(tokens);

  let email: string | null = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const info = await oauth2.userinfo.get();
    email = info.data.email ?? null;
  } catch {
    // non-fatal — connection still works without a displayed email
  }

  await prisma.googleDriveConnection.upsert({
    where: { id: CONNECTION_ID },
    create: { id: CONNECTION_ID, refreshToken: tokens.refresh_token, connectedEmail: email },
    update: { refreshToken: tokens.refresh_token, connectedEmail: email, rootFolderId: null },
  });

  return { email };
}

export async function disconnectDrive(): Promise<void> {
  await prisma.googleDriveConnection.deleteMany({ where: { id: CONNECTION_ID } });
}

export async function getDriveConnection() {
  return prisma.googleDriveConnection.findUnique({ where: { id: CONNECTION_ID } });
}

export async function isDriveEnabled(): Promise<boolean> {
  const conn = await getDriveConnection();
  return Boolean(conn?.refreshToken);
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

let cachedAuth: { refreshToken: string; client: InstanceType<typeof google.auth.OAuth2> } | null = null;

async function getAuthedClient() {
  const conn = await getDriveConnection();
  if (!conn?.refreshToken) throw new Error("Google Drive is not connected. Connect it from Admin → Integrations.");
  if (cachedAuth?.refreshToken === conn.refreshToken) return cachedAuth.client;

  const client = newOAuthClient();
  client.setCredentials({ refresh_token: conn.refreshToken });
  cachedAuth = { refreshToken: conn.refreshToken, client };
  return client;
}

async function getDrive() {
  const auth = await getAuthedClient();
  return google.drive({ version: "v3", auth });
}

async function getOrCreateRootFolder(): Promise<string> {
  const conn = await getDriveConnection();
  if (conn?.rootFolderId) return conn.rootFolderId;

  const drive = await getDrive();
  const res = await drive.files.create({
    requestBody: { name: ROOT_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  const folderId = res.data.id;
  if (!folderId) throw new Error("Google Drive did not return a folder id");
  await prisma.googleDriveConnection.update({ where: { id: CONNECTION_ID }, data: { rootFolderId: folderId } });
  return folderId;
}

export async function createClientFolder(name: string): Promise<string> {
  const drive = await getDrive();
  const rootId = await getOrCreateRootFolder();
  const res = await drive.files.create({
    requestBody: { name: name.slice(0, 200), mimeType: "application/vnd.google-apps.folder", parents: [rootId] },
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
  const drive = await getDrive();
  const parent = opts.folderId || (await getOrCreateRootFolder());

  const res = await drive.files.create({
    requestBody: { name: opts.filename, parents: [parent] },
    media: { mimeType: opts.mimeType || "application/octet-stream", body: Readable.from(opts.buffer) },
    fields: "id",
  });

  if (!res.data.id) throw new Error("Google Drive upload did not return a file id");
  return { fileId: res.data.id };
}

export async function downloadFromDrive(fileId: string): Promise<{ buffer: Buffer; mimeType: string | null }> {
  const drive = await getDrive();
  const [meta, content] = await Promise.all([
    drive.files.get({ fileId, fields: "mimeType" }),
    drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" }),
  ]);
  return { buffer: Buffer.from(content.data as ArrayBuffer), mimeType: meta.data.mimeType ?? null };
}

export async function trashDriveFile(fileId: string): Promise<void> {
  const drive = await getDrive();
  try {
    await drive.files.update({ fileId, requestBody: { trashed: true } });
  } catch {
    // already gone; ignore
  }
}
