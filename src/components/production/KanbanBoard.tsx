"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { daysLabel, bucketForDueDate, isAtRisk, isProductionDone } from "@/lib/deadlines";
import { PRODUCTION_STAGE_ORDER, PRODUCTION_STAGE_META, deadlineTone } from "@/lib/status";
import type { ProductionStage } from "@prisma/client";

interface StaffOption {
  id: string;
  name: string;
  avatarColor: string;
}

interface KanbanOrder {
  id: string;
  orderNumber: string;
  dueDate: string;
  client: { name: string; businessName: string | null };
  items: { quantity: number; product: { name: string } | null; customName: string | null }[];
  productionJob: { id: string; stage: ProductionStage; assignedStaff: StaffOption | null } | null;
}

function virtualStage(order: KanbanOrder): ProductionStage {
  return order.productionJob?.stage ?? "PENDING";
}

function OrderCard({ order, dragging = false }: { order: KanbanOrder; dragging?: boolean }) {
  const stage = virtualStage(order);
  const isDone = isProductionDone(stage);
  const atRisk = isAtRisk(order.dueDate, stage, isDone);
  const tone = atRisk ? "danger" : deadlineTone(bucketForDueDate(order.dueDate, isDone));
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const productText = order.items[0]?.product?.name ?? order.items[0]?.customName ?? "—";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-3 shadow-sm",
        dragging && "rotate-2 shadow-lg",
        atRisk && "ring-1 ring-danger/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/orders/${order.id}`} className="min-w-0 flex-1 hover:underline">
          <p className="truncate text-sm font-semibold text-foreground">{order.client.businessName || order.client.name}</p>
        </Link>
      </div>
      <p className="mt-1 truncate text-xs text-muted">
        {productText}
        {order.items.length > 1 && ` +${order.items.length - 1} more`} &middot; qty {totalQty}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <Badge tone={tone} dot className="text-[11px]">
          {daysLabel(order.dueDate, isDone)}
        </Badge>
        {atRisk && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        {order.productionJob?.assignedStaff ? (
          <span className="flex items-center gap-1.5">
            <Avatar name={order.productionJob.assignedStaff.name} color={order.productionJob.assignedStaff.avatarColor} size="xs" />
            <span className="text-[11px] text-muted">{order.productionJob.assignedStaff.name.split(" ")[0]}</span>
          </span>
        ) : (
          <span className="text-[11px] text-muted-light">Unassigned</span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-muted-light">
          <Clock className="h-3 w-3" />
          {order.orderNumber}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ order, canManage }: { order: KanbanOrder; canManage: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });

  return (
    <div ref={setNodeRef} className={cn("relative group", isDragging && "opacity-30")}>
      {canManage && (
        <button
          {...listeners}
          {...attributes}
          className="absolute -left-1.5 top-1/2 z-10 -translate-y-1/2 cursor-grab touch-none rounded bg-surface p-0.5 text-muted-light opacity-0 shadow-sm ring-1 ring-border group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to change stage"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <OrderCard order={order} />
    </div>
  );
}

function Column({ stage, orders, canManage }: { stage: ProductionStage; orders: KanbanOrder[]; canManage: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = PRODUCTION_STAGE_META[stage];

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-canvas">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
          <Badge tone={meta.tone}>{orders.length}</Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border-2 border-dashed p-2 transition-colors",
          isOver ? "border-accent bg-accent-soft/40" : "border-transparent"
        )}
      >
        {orders.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-light">No jobs here</p>}
        {orders.map((order) => (
          <DraggableCard key={order.id} order={order} canManage={canManage} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  initialOrders,
  canManage,
}: {
  initialOrders: KanbanOrder[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const columns = useMemo(() => {
    const map = new Map<ProductionStage, KanbanOrder[]>();
    for (const stage of PRODUCTION_STAGE_ORDER) map.set(stage, []);
    for (const order of orders) {
      const stage = virtualStage(order);
      map.get(stage)?.push(order);
    }
    return map;
  }, [orders]);

  const activeOrder = orders.find((o) => o.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || !canManage) return;

    const orderId = active.id as string;
    const newStage = over.id as ProductionStage;
    const order = orders.find((o) => o.id === orderId);
    if (!order || virtualStage(order) === newStage) return;

    const previous = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, productionJob: { id: o.productionJob?.id ?? "pending", stage: newStage, assignedStaff: o.productionJob?.assignedStaff ?? null } }
          : o
      )
    );
    setSaving(true);
    const form = new FormData();
    form.set("stage", newStage);
    const res = await fetch(`/api/orders/${orderId}/production`, { method: "PATCH", body: form });
    setSaving(false);
    if (!res.ok) {
      setOrders(previous);
    } else {
      router.refresh();
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders in the production pipeline"
        description="Confirmed orders will appear here automatically so you can move them through each stage."
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative">
        {saving && <p className="absolute -top-6 right-0 text-xs text-muted">Saving&hellip;</p>}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PRODUCTION_STAGE_ORDER.map((stage) => (
            <Column key={stage} stage={stage} orders={columns.get(stage) ?? []} canManage={canManage} />
          ))}
        </div>
      </div>
      <DragOverlay>{activeOrder ? <div className="w-64"><OrderCard order={activeOrder} dragging /></div> : null}</DragOverlay>
    </DndContext>
  );
}
