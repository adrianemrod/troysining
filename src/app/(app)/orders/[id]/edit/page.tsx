import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { OrderForm } from "@/components/orders/OrderForm";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/orders");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { client: true, items: { include: { product: true } } },
  });
  if (!order) notFound();

  if (session.role === "SALES" && order.salespersonId !== session.userId) redirect("/orders");

  const [products, salespeople] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "SALES", isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <Link href={`/orders/${order.id}`} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Order
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Edit {order.orderNumber}</h1>
        <p className="mt-1 text-sm text-muted">Update items, due date, downpayment, or notes.</p>
      </div>

      <Card className="p-6">
        <OrderForm
          clientOptions={[]}
          productOptions={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit, unitPrice: Number(p.unitPrice) }))}
          salesOptions={salespeople}
          currentUserId={session.userId}
          isAdmin={session.role === "ADMIN"}
          initial={{
            id: order.id,
            clientLabel: order.client.businessName || order.client.name,
            dueDate: order.dueDate.toISOString().slice(0, 16),
            downpayment: Number(order.downpayment),
            notes: order.notes ?? "",
            vatType: order.vatType,
            items: order.items.map((i) => ({
              isCustom: !i.productId,
              productId: i.productId ?? "",
              customName: i.customName ?? "",
              customPrice: i.productId ? "" : String(Number(i.unitPrice)),
              quantity: i.quantity,
              specs: i.specs ?? "",
            })),
          }}
        />
      </Card>
    </div>
  );
}
