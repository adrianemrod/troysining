import Link from "next/link";
import { Users, Plus, Phone, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { LEAD_STAGE_META, CLIENT_TYPE_META } from "@/lib/status";
import type { LeadStage, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAGE_TABS: { value: LeadStage | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW_INQUIRY", label: "New Inquiry" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CLOSED", label: "Closed" },
];

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const { q, stage } = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const where: Prisma.ClientWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { businessName: { contains: q, mode: "insensitive" } },
      { contactNumber: { contains: q, mode: "insensitive" } },
      { fbHandle: { contains: q, mode: "insensitive" } },
    ];
  }
  if (stage && stage !== "ALL") where.leadStage = stage as LeadStage;

  const clients = await prisma.client.findMany({
    where,
    include: { salesOwner: { select: { name: true, avatarColor: true } }, _count: { select: { orders: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const canCreate = ["ADMIN", "SALES"].includes(session.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM & Clients</h1>
          <p className="mt-1 text-sm text-muted">{clients.length} client{clients.length === 1 ? "" : "s"} in the pipeline</p>
        </div>
        {canCreate && (
          <LinkButton href="/crm/new">
            <Plus className="h-4 w-4" /> Add Client
          </LinkButton>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STAGE_TABS.map((tab) => {
          const active = (stage ?? "ALL") === tab.value;
          const href = tab.value === "ALL" ? "/crm" : `/crm?stage=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white" : "bg-surface text-muted border border-border hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients match your filters"
          description="Try a different search term or lead stage, or add a new client to get started."
          action={canCreate && <LinkButton href="/crm/new" size="sm">Add Client</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/crm/${client.id}`}>
              <Card accentTone={LEAD_STAGE_META[client.leadStage].tone} className="h-full p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{client.businessName || client.name}</p>
                    {client.businessName && <p className="truncate text-xs text-muted">{client.name}</p>}
                  </div>
                  <Badge tone={CLIENT_TYPE_META[client.clientType].tone}>{CLIENT_TYPE_META[client.clientType].label}</Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted">
                  {client.contactNumber && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {client.contactNumber}
                    </p>
                  )}
                  {client.fbHandle && (
                    <p className="flex items-center gap-1.5 truncate">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" /> {client.fbHandle}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <Badge tone={LEAD_STAGE_META[client.leadStage].tone}>{LEAD_STAGE_META[client.leadStage].label}</Badge>
                  <span className="text-xs text-muted">{client._count.orders} order{client._count.orders === 1 ? "" : "s"}</span>
                </div>

                {client.salesOwner && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Avatar name={client.salesOwner.name} color={client.salesOwner.avatarColor} size="xs" />
                    <span className="text-xs text-muted">{client.salesOwner.name}</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
