import { AlertTriangle, CalendarClock, Factory, Truck, PartyPopper, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getRoleVisibleOrders, bucketOrders } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatManilaDate } from "@/lib/utils";
import { JobCard } from "@/components/dashboard/JobCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", hour12: false }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const orders = await getRoleVisibleOrders(session);
  const bucketed = bucketOrders(orders);

  const overdue = bucketed.filter((b) => b.bucket === "overdue");
  const dueToday = bucketed.filter((b) => b.bucket === "today");
  const thisWeek = bucketed.filter((b) => b.bucket === "this_week");

  const inProduction = bucketed.filter(
    (b) => b.order.productionJob && ["DESIGNING", "PRINTING", "FINISHING", "QUALITY_CHECK"].includes(b.order.productionJob.stage)
  );

  const showReadyForDelivery = ["ADMIN", "SALES", "DELIVERY"].includes(session.role);
  const readyForDelivery = bucketed.filter((b) => b.order.productionJob?.stage === "READY_FOR_DELIVERY");

  const scopeLabel =
    session.role === "PRODUCTION"
      ? "your production queue"
      : session.role === "DELIVERY"
      ? "deliveries"
      : "the company";

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div>
        <p className="text-sm text-muted">{formatManilaDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {greeting()}, {user?.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s due and in motion across {scopeLabel} right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Overdue" value={overdue.length} icon={AlertTriangle} tone="danger" href="#overdue" />
        <StatTile label="Due Today" value={dueToday.length} icon={CalendarClock} tone="accent" href="#due-today" />
        <StatTile label="In Production" value={inProduction.length} icon={Factory} tone="warning" href="#in-production" />
        {showReadyForDelivery ? (
          <StatTile label="Ready for Delivery" value={readyForDelivery.length} icon={Truck} tone="success" href="#ready-for-delivery" />
        ) : (
          <StatTile label="Due This Week" value={thisWeek.length} icon={CalendarClock} tone="neutral" href="#upcoming-this-week" />
        )}
      </div>

      {/* Overdue — impossible to miss */}
      <section id="overdue" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold text-danger">Overdue</h2>
          <Badge tone="danger" dot>
            {overdue.length} job{overdue.length === 1 ? "" : "s"} past deadline
          </Badge>
        </div>
        {overdue.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nothing overdue" description="Every job is still within its deadline. Keep it up!" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overdue.map((b) => (
              <JobCard key={b.order.id} order={b.order} bucket={b.bucket} atRisk={b.atRisk} />
            ))}
          </div>
        )}
      </section>

      {/* Due Today — top priority section */}
      <section id="due-today" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">Due Today</h2>
          <Badge tone="accent" dot>
            {dueToday.length} job{dueToday.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {dueToday.length === 0 ? (
          <EmptyState icon={PartyPopper} title="No jobs due today" description="Nothing urgent on the clock — great time to get ahead on this week's queue." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dueToday.map((b) => (
              <JobCard key={b.order.id} order={b.order} bucket={b.bucket} atRisk={b.atRisk} />
            ))}
          </div>
        )}
      </section>

      {/* Ready for Delivery — Admin / Delivery focus */}
      {showReadyForDelivery && (
        <section id="ready-for-delivery" className="scroll-mt-24">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Ready for Delivery</h2>
            <Badge tone="success" dot>
              {readyForDelivery.length} job{readyForDelivery.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {readyForDelivery.length === 0 ? (
            <EmptyState icon={Truck} title="Nothing ready for delivery yet" description="Jobs that finish Quality Check will show up here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {readyForDelivery.map((b) => (
                <JobCard key={b.order.id} order={b.order} bucket={b.bucket} atRisk={b.atRisk} showProgress={false} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* In Production Right Now */}
      <section id="in-production" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">In Production Right Now</h2>
          <Badge tone="neutral" dot>
            {inProduction.length} active
          </Badge>
        </div>
        {inProduction.length === 0 ? (
          <EmptyState icon={Factory} title="No active production jobs" description="Once a job order moves to Designing, Printing, Finishing, or Quality Check, it'll show up here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProduction.map((b) => (
              <JobCard key={b.order.id} order={b.order} bucket={b.bucket} atRisk={b.atRisk} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming This Week — collapsed by default, auto-expands when linked to */}
      <CollapsibleSection id="upcoming-this-week" title="Upcoming This Week" subtitle="Due within the next 7 days" count={thisWeek.length}>
        {thisWeek.length === 0 ? (
          <EmptyState title="Nothing else due this week" description="You're all caught up beyond today." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {thisWeek.map((b) => (
              <JobCard key={b.order.id} order={b.order} bucket={b.bucket} atRisk={b.atRisk} />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
