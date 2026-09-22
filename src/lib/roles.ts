import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "General Manager / Admin",
  SALES: "Sales",
  PRODUCTION: "Production",
  DELIVERY: "Delivery / Logistics",
  ENCODER: "Graphic Artist / Digital Operator",
};
