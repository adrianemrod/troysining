import type { LeadStage, ProductionStage, DeliveryStatus, ClientType, Role } from "@prisma/client";

export type Tone = "neutral" | "info" | "warning" | "danger" | "success" | "accent";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const LEAD_STAGE_META: Record<LeadStage, StatusMeta> = {
  NEW_INQUIRY: { label: "New Inquiry", tone: "neutral" },
  QUOTED: { label: "Quoted", tone: "info" },
  CONFIRMED: { label: "Confirmed", tone: "accent" },
  IN_PRODUCTION: { label: "In Production", tone: "warning" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const PRODUCTION_STAGE_META: Record<ProductionStage, StatusMeta> = {
  PENDING: { label: "Pending", tone: "neutral" },
  DESIGNING: { label: "Designing / Prepress", tone: "info" },
  PRINTING: { label: "Printing", tone: "accent" },
  FINISHING: { label: "Finishing", tone: "accent" },
  QUALITY_CHECK: { label: "Quality Check", tone: "warning" },
  READY_FOR_DELIVERY: { label: "Ready for Delivery", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
};

export const PRODUCTION_STAGE_ORDER: ProductionStage[] = [
  "PENDING",
  "DESIGNING",
  "PRINTING",
  "FINISHING",
  "QUALITY_CHECK",
  "READY_FOR_DELIVERY",
];

export const DELIVERY_STATUS_META: Record<DeliveryStatus, StatusMeta> = {
  PREPARING: { label: "Preparing", tone: "neutral" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "success" },
  FAILED_RESCHEDULED: { label: "Failed / Rescheduled", tone: "danger" },
};

export const CLIENT_TYPE_META: Record<ClientType, StatusMeta> = {
  ONE_TIME: { label: "One-time", tone: "neutral" },
  REPEAT: { label: "Repeat Customer", tone: "success" },
};

export const ROLE_META: Record<Role, StatusMeta> = {
  ADMIN: { label: "Admin / GM", tone: "accent" },
  SALES: { label: "Sales", tone: "info" },
  PRODUCTION: { label: "Production", tone: "warning" },
  DELIVERY: { label: "Delivery", tone: "success" },
  ENCODER: { label: "Encoder / Staff", tone: "neutral" },
};

export function deadlineTone(bucket: "overdue" | "today" | "this_week" | "later"): Tone {
  if (bucket === "overdue") return "danger";
  if (bucket === "today") return "accent";
  if (bucket === "this_week") return "warning";
  return "neutral";
}
