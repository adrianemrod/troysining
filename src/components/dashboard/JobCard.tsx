import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StageProgress } from "@/components/dashboard/StageProgress";
import { formatManilaTime } from "@/lib/utils";
import { daysLabel } from "@/lib/deadlines";
import { PRODUCTION_STAGE_META, deadlineTone, type Tone } from "@/lib/status";
import type { OrderWithRelations } from "@/lib/queries";
import type { DeadlineBucket } from "@/lib/deadlines";

function itemsSummary(order: OrderWithRelations): { text: string; totalQty: number } {
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const first = order.items[0];
  const firstName = first?.product?.name ?? first?.customName ?? "—";
  const text = order.items.length <= 1 ? firstName : `${firstName} +${order.items.length - 1} more`;
  return { text, totalQty };
}

export function JobCard({
  order,
  bucket,
  atRisk,
  showProgress = true,
}: {
  order: OrderWithRelations;
  bucket: DeadlineBucket;
  atRisk: boolean;
  showProgress?: boolean;
}) {
  const { text, totalQty } = itemsSummary(order);
  const tone: Tone = atRisk ? "danger" : deadlineTone(bucket);
  const stage = order.productionJob?.stage;

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card accentTone={tone} className="group p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {order.client.businessName || order.client.name}
            </p>
            <p className="truncate text-xs text-muted">{order.orderNumber}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={tone} dot>
              {daysLabel(order.dueDate)}
            </Badge>
            {atRisk && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-danger">
                <AlertTriangle className="h-3 w-3" /> At risk
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 truncate text-sm text-foreground">
          {text} <span className="text-muted">&middot; qty {totalQty}</span>
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            {formatManilaTime(order.dueDate)}
          </div>
          {stage && (
            <Badge tone={PRODUCTION_STAGE_META[stage].tone}>{PRODUCTION_STAGE_META[stage].label}</Badge>
          )}
        </div>

        {showProgress && stage && (
          <div className="mt-3">
            <StageProgress stage={stage} />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {order.productionJob?.assignedStaff ? (
              <>
                <Avatar name={order.productionJob.assignedStaff.name} color={order.productionJob.assignedStaff.avatarColor} size="xs" />
                <span className="text-xs text-muted">{order.productionJob.assignedStaff.name}</span>
              </>
            ) : (
              <span className="text-xs text-muted-light">Unassigned</span>
            )}
          </div>
          <span className="text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">View details &rarr;</span>
        </div>
      </Card>
    </Link>
  );
}
