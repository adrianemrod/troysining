import { Users, History, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatTile } from "@/components/dashboard/StatTile";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [userCount, activeInvites, activityCount] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.invite.count({ where: { status: "PENDING" } }),
    prisma.activityLog.count(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin
        </h1>
        <p className="mt-1 text-sm text-muted">Manage your team, roles, and company-wide activity.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Active Team Members" value={userCount} icon={Users} tone="neutral" />
        <StatTile label="Pending Invites" value={activeInvites} icon={Users} tone="accent" />
        <StatTile label="Logged Actions" value={activityCount} icon={History} tone="neutral" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" /> Team & Roles
          </h2>
          <p className="mt-1.5 text-sm text-muted">Invite teammates, manage roles, and deactivate access.</p>
          <LinkButton href="/admin/users" variant="outline" size="sm" className="mt-3">
            Manage Users
          </LinkButton>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4 text-primary" /> Activity Log
          </h2>
          <p className="mt-1.5 text-sm text-muted">See who did what, and when, across the system.</p>
          <LinkButton href="/admin/activity" variant="outline" size="sm" className="mt-3">
            View Activity Log
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
