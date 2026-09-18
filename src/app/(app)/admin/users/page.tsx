import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UsersManager } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const [users, invites] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.invite.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Team & Roles</h1>
        <p className="mt-1 text-sm text-muted">{users.length} team member{users.length === 1 ? "" : "s"}</p>
      </div>

      <UsersManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        initialInvites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role, status: i.status, expiresAt: i.expiresAt.toISOString() }))}
        currentUserId={session.userId}
      />
    </div>
  );
}
