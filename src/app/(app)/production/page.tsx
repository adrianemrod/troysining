import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { KanbanBoard } from "@/components/production/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["DELIVERED", "CLOSED"] },
      OR: [{ status: { in: ["CONFIRMED", "IN_PRODUCTION"] } }, { productionJob: { isNot: null } }],
    },
    include: {
      client: true,
      items: { include: { product: true } },
      productionJob: { include: { assignedStaff: { select: { id: true, name: true, avatarColor: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  const canManage = ["ADMIN", "PRODUCTION"].includes(session.role);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Production Tracker</h1>
        <p className="mt-1 text-sm text-muted">
          Drag a job card across stages as work progresses. Every card shows time left until deadline.
        </p>
      </div>
      <KanbanBoard initialOrders={JSON.parse(JSON.stringify(orders))} canManage={canManage} />
    </div>
  );
}
