import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";
import { bucketForDueDate, isAtRisk, type DeadlineBucket } from "@/lib/deadlines";
import { Prisma } from "@prisma/client";

const orderWithRelations = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: {
    client: true,
    salesperson: { select: { id: true, name: true, avatarColor: true } },
    items: { include: { product: true } },
    productionJob: { include: { assignedStaff: { select: { id: true, name: true, avatarColor: true } } } },
    delivery: { include: { rider: { select: { id: true, name: true } } } },
  },
});
export type OrderWithRelations = Prisma.OrderGetPayload<typeof orderWithRelations>;

export interface BucketedOrder {
  order: OrderWithRelations;
  bucket: DeadlineBucket;
  atRisk: boolean;
}

/** Orders relevant to this user's role, for the deadline-first dashboard. Excludes closed/delivered history. */
export async function getRoleVisibleOrders(session: SessionPayload): Promise<OrderWithRelations[]> {
  const where: Prisma.OrderWhereInput = {
    status: { notIn: ["DELIVERED", "CLOSED"] },
  };

  if (session.role === "SALES") {
    where.salespersonId = session.userId;
  } else if (session.role === "PRODUCTION") {
    where.productionJob = { isNot: null };
  } else if (session.role === "DELIVERY") {
    where.OR = [
      { delivery: { isNot: null } },
      { productionJob: { stage: "READY_FOR_DELIVERY" } },
    ];
  }
  // ADMIN and ENCODER see everything in the active pipeline.

  return prisma.order.findMany({
    where,
    ...orderWithRelations,
    orderBy: { dueDate: "asc" },
  });
}

export function bucketOrders(orders: OrderWithRelations[]): BucketedOrder[] {
  return orders.map((order) => ({
    order,
    bucket: bucketForDueDate(order.dueDate),
    atRisk: order.productionJob
      ? isAtRisk(order.dueDate, order.productionJob.stage, ["COMPLETED", "READY_FOR_DELIVERY"].includes(order.productionJob.stage))
      : bucketForDueDate(order.dueDate) === "overdue",
  }));
}

export async function getUrgentAlertCount(session: SessionPayload): Promise<number> {
  const orders = await getRoleVisibleOrders(session);
  return orders.filter((o) => {
    const bucket = bucketForDueDate(o.dueDate);
    return bucket === "overdue" || bucket === "today";
  }).length;
}
