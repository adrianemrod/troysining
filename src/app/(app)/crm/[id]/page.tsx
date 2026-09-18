import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MessageCircle, MapPin, ClipboardList, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { formatManilaDate, formatPHP } from "@/lib/utils";
import { LEAD_STAGE_META, CLIENT_TYPE_META } from "@/lib/status";
import { LeadStageEditor } from "@/components/crm/LeadStageEditor";
import { NotesTimeline } from "@/components/crm/NotesTimeline";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      salesOwner: { select: { id: true, name: true, avatarColor: true } },
      notes: { include: { author: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });

  if (!client) notFound();

  const canEdit = ["ADMIN", "SALES"].includes(session.role);
  const canNote = ["ADMIN", "SALES", "ENCODER"].includes(session.role);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <Link href="/crm" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to CRM
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{client.businessName || client.name}</h1>
            {client.businessName && <p className="text-sm text-muted">{client.name}</p>}
          </div>
          {canEdit ? (
            <LeadStageEditor clientId={client.id} initialStage={client.leadStage} initialType={client.clientType} />
          ) : (
            <div className="flex gap-2">
              <Badge tone={LEAD_STAGE_META[client.leadStage].tone}>{LEAD_STAGE_META[client.leadStage].label}</Badge>
              <Badge tone={CLIENT_TYPE_META[client.clientType].tone}>{CLIENT_TYPE_META[client.clientType].label}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" /> Notes & Timeline
              </h2>
            </div>
            <div className="mt-4">
              <NotesTimeline
                clientId={client.id}
                initialNotes={client.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
                canAdd={canNote}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Order History</h2>
              <span className="text-xs text-muted">{client.orders.length} order{client.orders.length === 1 ? "" : "s"}</span>
            </div>
            {client.orders.length === 0 ? (
              <EmptyState title="No orders yet" description="Job orders created for this client will appear here." className="py-8" />
            ) : (
              <div className="mt-3 divide-y divide-border">
                {client.orders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-canvas -mx-2 px-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted">Due {formatManilaDate(order.dueDate)} &middot; {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatPHP(Number(order.totalAmount))}</span>
                      <Badge tone={LEAD_STAGE_META[order.status].tone}>{LEAD_STAGE_META[order.status].label}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Contact Info</h2>
            <div className="mt-3 space-y-2.5 text-sm text-muted">
              {client.contactNumber && (
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {client.contactNumber}</p>
              )}
              {client.email && (
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> {client.email}</p>
              )}
              {client.fbHandle && (
                <p className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 shrink-0" /> {client.fbHandle}</p>
              )}
              {client.address && (
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> {client.address}</p>
              )}
            </div>
          </Card>

          {client.salesOwner && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Sales Owner</h2>
              <div className="mt-3 flex items-center gap-2.5">
                <Avatar name={client.salesOwner.name} color={client.salesOwner.avatarColor} size="sm" />
                <p className="text-sm font-medium">{client.salesOwner.name}</p>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FolderOpen className="h-4 w-4 text-primary" /> Files
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted">Design files, proofs, contracts, and FB screenshots for this client.</p>
            <LinkButton href={`/files?client=${client.id}`} variant="outline" size="sm" className="mt-3">
              Open File Organizer
            </LinkButton>
          </Card>
        </div>
      </div>
    </div>
  );
}
