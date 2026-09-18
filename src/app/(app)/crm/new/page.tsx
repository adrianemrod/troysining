import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/crm/ClientForm";

export default async function NewClientPage() {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/crm");

  const salesOptions = await prisma.user.findMany({ where: { role: "SALES", isActive: true }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href="/crm" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to CRM
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Add Client</h1>
        <p className="mt-1 text-sm text-muted">Log a new inquiry or client relationship.</p>
      </div>
      <Card className="p-6">
        <ClientForm salesOptions={salesOptions} currentUserId={session.userId} isAdmin={session.role === "ADMIN"} />
      </Card>
    </div>
  );
}
