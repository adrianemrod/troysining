import Link from "next/link";
import { Truck, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatManilaDate } from "@/lib/utils";
import { daysLabel } from "@/lib/deadlines";
import { DELIVERY_STATUS_META } from "@/lib/status";
import type { DeliveryStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  PICKUP: "Client Pickup",
  IN_HOUSE: "In-house Delivery",
  COURIER: "3rd-party Courier",
};

export default async function DeliveryPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CLOSED"] },
      OR: [{ delivery: { isNot: null } }, { productionJob: { stage: "READY_FOR_DELIVERY" } }],
    },
    include: {
      client: true,
      delivery: { include: { rider: { select: { id: true, name: true, avatarColor: true } } } },
      productionJob: true,
    },
    orderBy: { dueDate: "asc" },
  });

  type Row = (typeof orders)[number];
  const groups: Record<"NOT_SCHEDULED" | DeliveryStatus, Row[]> = {
    NOT_SCHEDULED: [],
    PREPARING: [],
    OUT_FOR_DELIVERY: [],
    DELIVERED: [],
    FAILED_RESCHEDULED: [],
  };

  for (const order of orders) {
    if (!order.delivery) groups.NOT_SCHEDULED.push(order);
    else groups[order.delivery.status].push(order);
  }

  const sections: { key: keyof typeof groups; label: string; description: string }[] = [
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", description: "On the road right now" },
    { key: "NOT_SCHEDULED", label: "Ready — Not Yet Scheduled", description: "Finished production, needs a delivery plan" },
    { key: "PREPARING", label: "Preparing", description: "Scheduled and being prepared" },
    { key: "FAILED_RESCHEDULED", label: "Failed / Rescheduled", description: "Needs follow-up" },
    { key: "DELIVERED", label: "Delivered", description: "Completed deliveries" },
  ];

  const totalActive = orders.length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Delivery Tracker</h1>
        <p className="mt-1 text-sm text-muted">{totalActive} job{totalActive === 1 ? "" : "s"} in the delivery pipeline</p>
      </div>

      {totalActive === 0 ? (
        <EmptyState icon={Truck} title="Nothing to deliver right now" description="Jobs marked Ready for Delivery will show up here automatically." />
      ) : (
        sections.map((section) => {
          const rows = groups[section.key];
          if (rows.length === 0) return null;
          return (
            <section key={section.key}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{section.label}</h2>
                <Badge tone={section.key === "NOT_SCHEDULED" ? "accent" : section.key === "FAILED_RESCHEDULED" ? "danger" : "neutral"} dot>
                  {rows.length}
                </Badge>
              </div>
              <p className="mb-3 text-xs text-muted">{section.description}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card
                      accentTone={section.key === "NOT_SCHEDULED" || section.key === "FAILED_RESCHEDULED" ? "danger" : "neutral"}
                      className="h-full p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{order.client.businessName || order.client.name}</p>
                        {order.delivery && <Badge tone={DELIVERY_STATUS_META[order.delivery.status].tone}>{DELIVERY_STATUS_META[order.delivery.status].label}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted">{order.orderNumber} &middot; Due {formatManilaDate(order.dueDate)} &middot; {daysLabel(order.dueDate, order.delivery?.status === "DELIVERED")}</p>
                      {order.delivery?.method && <p className="mt-2 text-xs text-muted">{METHOD_LABELS[order.delivery.method]}</p>}
                      {(order.delivery?.address || order.client.address) && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {order.delivery?.address || order.client.address}
                        </p>
                      )}
                      {order.delivery?.rider && (
                        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5">
                          <Avatar name={order.delivery.rider.name} color={order.delivery.rider.avatarColor} size="xs" />
                          <span className="text-xs text-muted">{order.delivery.rider.name}</span>
                        </div>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
