import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatManilaDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "logged in",
  LOGOUT: "logged out",
  PASSWORD_RESET: "reset their password",
  INVITE_SENT: "sent a team invite",
  INVITE_ACCEPTED: "accepted a team invite",
  USER_UPDATED: "updated a team member",
  CLIENT_CREATED: "added a client",
  CLIENT_UPDATED: "updated a client",
  CLIENT_DELETED: "deleted a client",
  PRODUCT_CREATED: "added a product",
  PRODUCT_UPDATED: "updated a product",
  PRODUCT_DELETED: "removed a product",
  ORDER_CREATED: "created an order",
  ORDER_UPDATED: "updated an order",
  PRODUCTION_STAGE_UPDATED: "updated a production stage",
  DELIVERY_STATUS_UPDATED: "updated a delivery status",
  FILE_UPLOADED: "uploaded a file",
  ORDER_DELETED: "deleted an order",
  EXPENSE_CREATED: "logged an expense",
  EXPENSE_UPDATED: "updated an expense",
  EXPENSE_DELETED: "deleted an expense",
  SYSTEM_SEEDED: "seeded the database",
};

export default async function ActivityLogPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, avatarColor: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-foreground">
          <History className="h-6 w-6 text-primary" /> Activity Log
        </h1>
        <p className="mt-1 text-sm text-muted">Who did what, and when — across the whole system.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <Card className="p-5">
          <ol className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="flex gap-3">
                <Avatar name={log.user.name} color={log.user.avatarColor} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{log.user.name}</span>{" "}
                    <span className="text-muted">{ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, " ")}</span>
                  </p>
                  {log.details && <p className="text-xs text-muted-light">{log.details}</p>}
                  <p className="text-xs text-muted-light">{formatManilaDateTime(log.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
