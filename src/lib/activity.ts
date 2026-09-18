import { prisma } from "@/lib/prisma";

export async function logActivity(opts: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({ data: opts });
  } catch {
    // activity logging must never break the primary action
  }
}
