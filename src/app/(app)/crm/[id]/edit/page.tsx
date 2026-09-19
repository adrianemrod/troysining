import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/crm/ClientForm";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/crm");

  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  if (session.role === "SALES" && client.salesOwnerId !== session.userId) redirect("/crm");

  const salesOptions = await prisma.user.findMany({ where: { role: "SALES", isActive: true }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href={`/crm/${client.id}`} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Client
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Edit Client</h1>
      </div>
      <Card className="p-6">
        <ClientForm
          salesOptions={salesOptions}
          currentUserId={session.userId}
          isAdmin={session.role === "ADMIN"}
          initial={{
            id: client.id,
            name: client.name,
            businessName: client.businessName ?? "",
            contactNumber: client.contactNumber ?? "",
            fbHandle: client.fbHandle ?? "",
            email: client.email ?? "",
            address: client.address ?? "",
            clientType: client.clientType,
            leadStage: client.leadStage,
            salesOwnerId: client.salesOwnerId ?? session.userId,
          }}
        />
      </Card>
    </div>
  );
}
