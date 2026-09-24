import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { OrderForm } from "@/components/orders/OrderForm";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/orders");

  const { client } = await searchParams;

  const [clients, products, salespeople] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true, businessName: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "SALES", isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <Link href="/orders" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">New Job Order</h1>
        <p className="mt-1 text-sm text-muted">Build a quotation from the catalog and lock in a due date.</p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add a client first so you can attach this order to them."
          action={<LinkButton href="/crm/new" size="sm">Add Client</LinkButton>}
        />
      ) : (
        <Card className="p-6">
          <OrderForm
            clientOptions={clients}
            productOptions={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit, unitPrice: Number(p.unitPrice) }))}
            salesOptions={salespeople}
            currentUserId={session.userId}
            isAdmin={session.role === "ADMIN"}
            preselectedClientId={client}
          />
        </Card>
      )}
    </div>
  );
}
