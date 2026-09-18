import Link from "next/link";
import { ClipboardList, Plus, TrendingUp, Trophy, Package2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/dashboard/StatTile";
import { formatManilaDate, formatPHP } from "@/lib/utils";
import { LEAD_STAGE_META } from "@/lib/status";

export const dynamic = "force-dynamic";

function startOfManilaMonth(): Date {
  const now = new Date();
  const manilaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit" }).format(now);
  const [year, month] = manilaStr.split("-");
  // Manila is UTC+8 with no DST — month start in Manila translates to the previous UTC day at 16:00.
  return new Date(`${year}-${month}-01T00:00:00+08:00`);
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const where = session.role === "SALES" ? { salespersonId: session.userId } : {};
  const monthStart = startOfManilaMonth();

  const [orders, monthlyAgg, topClientsAgg, topItemsAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { client: true, salesperson: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.aggregate({ where: { ...where, createdAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
    prisma.order.groupBy({
      by: ["clientId"],
      where,
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: where.salespersonId ? { order: { salespersonId: where.salespersonId } } : undefined,
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
  ]);

  const [clientNames, productNames] = await Promise.all([
    prisma.client.findMany({ where: { id: { in: topClientsAgg.map((c) => c.clientId) } }, select: { id: true, name: true, businessName: true } }),
    prisma.product.findMany({ where: { id: { in: topItemsAgg.map((i) => i.productId) } }, select: { id: true, name: true } }),
  ]);
  const clientNameMap = new Map(clientNames.map((c) => [c.id, c.businessName || c.name]));
  const productNameMap = new Map(productNames.map((p) => [p.id, p.name]));

  const canCreate = ["ADMIN", "SALES"].includes(session.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales & Orders</h1>
          <p className="mt-1 text-sm text-muted">{orders.length} order{orders.length === 1 ? "" : "s"} on record</p>
        </div>
        {canCreate && (
          <LinkButton href="/orders/new">
            <Plus className="h-4 w-4" /> New Order
          </LinkButton>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Sales This Month" value={formatPHP(Number(monthlyAgg._sum.totalAmount ?? 0))} icon={TrendingUp} tone="success" />
        <StatTile label="Orders This Month" value={monthlyAgg._count} icon={ClipboardList} tone="accent" />
        <StatTile label="Total Orders" value={orders.length} icon={Package2} tone="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-accent" /> Top Clients
          </h2>
          {topClientsAgg.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sales data yet.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {topClientsAgg.map((c, i) => (
                <li key={c.clientId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">{i + 1}</span>
                    {clientNameMap.get(c.clientId) ?? "Unknown"}
                  </span>
                  <span className="font-medium">{formatPHP(Number(c._sum.totalAmount ?? 0))}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Package2 className="h-4 w-4 text-accent" /> Top Products
          </h2>
          {topItemsAgg.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sales data yet.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {topItemsAgg.map((item, i) => (
                <li key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">{i + 1}</span>
                    {productNameMap.get(item.productId) ?? "Unknown"}
                  </span>
                  <span className="font-medium">{item._sum.quantity} units</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">All Orders</h2>
        {orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No orders yet" description="Create your first job order from a client quotation." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Due Date</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-canvas/60">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{order.client.businessName || order.client.name}</td>
                    <td className="px-4 py-3 text-muted">{formatManilaDate(order.dueDate)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={LEAD_STAGE_META[order.status].tone}>{LEAD_STAGE_META[order.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatPHP(Number(order.totalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
