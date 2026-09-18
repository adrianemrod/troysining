import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, MapPin, Phone, MessageCircle, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { formatManilaDate, formatPHP } from "@/lib/utils";
import { daysLabel, bucketForDueDate } from "@/lib/deadlines";
import { LEAD_STAGE_META, deadlineTone } from "@/lib/status";
import { ProductionPanel } from "@/components/orders/ProductionPanel";
import { DeliveryPanel } from "@/components/orders/DeliveryPanel";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      salesperson: { select: { id: true, name: true, avatarColor: true, email: true } },
      items: { include: { product: true } },
      productionJob: {
        include: {
          assignedStaff: { select: { id: true, name: true, avatarColor: true } },
          statusLogs: { include: { author: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { createdAt: "desc" } },
        },
      },
      delivery: { include: { rider: { select: { id: true, name: true, avatarColor: true } } } },
      files: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order) notFound();

  const [productionStaff, riders] = await Promise.all([
    prisma.user.findMany({ where: { role: "PRODUCTION", isActive: true }, select: { id: true, name: true, avatarColor: true } }),
    prisma.user.findMany({ where: { role: "DELIVERY", isActive: true }, select: { id: true, name: true, avatarColor: true } }),
  ]);

  const totalAmount = Number(order.totalAmount);
  const downpayment = Number(order.downpayment);
  const balance = totalAmount - downpayment;
  const bucket = bucketForDueDate(order.dueDate);

  const canManageProduction = ["ADMIN", "PRODUCTION"].includes(session.role);
  const canManageDelivery = ["ADMIN", "DELIVERY"].includes(session.role);
  const canEditOrder = session.role === "ADMIN" || (session.role === "SALES" && order.salespersonId === session.userId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
              <Badge tone={LEAD_STAGE_META[order.status].tone}>{LEAD_STAGE_META[order.status].label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {order.client.businessName || order.client.name} &middot; Created {formatManilaDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={deadlineTone(bucket)} dot className="px-3 py-1.5 text-sm">
              Due {formatManilaDate(order.dueDate)} &middot; {daysLabel(order.dueDate)}
            </Badge>
            <LinkButton href={`/orders/${order.id}/print`} variant="outline" size="md">
              <Printer className="h-4 w-4" /> Quotation
            </LinkButton>
            {canEditOrder && (
              <>
                <LinkButton href={`/orders/${order.id}/edit`} variant="outline" size="md">
                  <Pencil className="h-4 w-4" /> Edit
                </LinkButton>
                <DeleteButton
                  endpoint={`/api/orders/${order.id}`}
                  confirmMessage={`Delete order ${order.orderNumber}? This removes its production and delivery records too. This cannot be undone.`}
                  redirectTo="/orders"
                  label="Delete"
                  className="h-10 border border-border"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Order Items</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Specs</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Unit Price</th>
                    <th className="pb-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium text-foreground">{item.product.name}</td>
                      <td className="py-2.5 text-muted">{item.specs || "—"}</td>
                      <td className="py-2.5 text-right">{item.quantity}</td>
                      <td className="py-2.5 text-right">{formatPHP(Number(item.unitPrice))}</td>
                      <td className="py-2.5 text-right font-medium">{formatPHP(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {order.notes && (
              <div className="mt-4 rounded-lg bg-canvas p-3 text-sm text-muted">
                <span className="font-medium text-foreground">Notes: </span>
                {order.notes}
              </div>
            )}
          </Card>

          <ProductionPanel
            orderId={order.id}
            dueDate={order.dueDate.toISOString()}
            job={order.productionJob}
            staffOptions={productionStaff}
            canManage={canManageProduction}
          />

          <DeliveryPanel
            orderId={order.id}
            delivery={order.delivery}
            riderOptions={riders}
            canManage={canManageDelivery}
            defaultAddress={order.client.address}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Client</h2>
            <Link href={`/crm/${order.client.id}`} className="mt-3 block rounded-lg p-2 -m-2 hover:bg-canvas">
              <p className="font-semibold text-foreground">{order.client.businessName || order.client.name}</p>
              {order.client.businessName && <p className="text-xs text-muted">{order.client.name}</p>}
            </Link>
            <div className="mt-3 space-y-2 text-sm text-muted">
              {order.client.contactNumber && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {order.client.contactNumber}
                </p>
              )}
              {order.client.fbHandle && (
                <p className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" /> {order.client.fbHandle}
                </p>
              )}
              {order.client.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {order.client.address}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Payment</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-medium">{formatPHP(totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Downpayment</span><span className="font-medium text-success">{formatPHP(downpayment)}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="text-muted">Balance</span><span className="font-bold text-foreground">{formatPHP(balance)}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Salesperson</h2>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar name={order.salesperson.name} color={order.salesperson.avatarColor} size="sm" />
              <div>
                <p className="text-sm font-medium">{order.salesperson.name}</p>
                <p className="text-xs text-muted">{order.salesperson.email}</p>
              </div>
            </div>
          </Card>

          {order.files.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Recent Files</h2>
                <Link href={`/files?client=${order.clientId}`} className="text-xs font-medium text-accent hover:text-accent-hover">
                  View all
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {order.files.map((f) => (
                  <li key={f.id} className="truncate text-sm text-muted">
                    <a href={f.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                      {f.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
