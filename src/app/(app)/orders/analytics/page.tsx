import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/dashboard/StatTile";
import { MonthlyTrendChart } from "@/components/analytics/MonthlyTrendChart";
import { formatPHP } from "@/lib/utils";
import { lastNMonths, manilaMonthKey, monthsAgoStart } from "@/lib/analytics";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const MONTHS_SHOWN = 12;

export default async function SalesAnalyticsPage() {
  const session = await getSession();
  if (!session) return null;

  const where: Prisma.OrderWhereInput = session.role === "SALES" ? { salespersonId: session.userId } : {};
  const since = monthsAgoStart(MONTHS_SHOWN);

  const orders = await prisma.order.findMany({
    where: { ...where, createdAt: { gte: since } },
    select: { createdAt: true, totalAmount: true },
  });

  const months = lastNMonths(MONTHS_SHOWN);
  const totalsByMonth = new Map(months.map((m) => [m.key, 0]));
  const countByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const order of orders) {
    const key = manilaMonthKey(order.createdAt);
    if (totalsByMonth.has(key)) {
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + Number(order.totalAmount));
      countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
    }
  }

  const chartData = months.map((m) => ({ label: m.label, value: totalsByMonth.get(m.key) ?? 0 }));
  const periodTotal = chartData.reduce((sum, d) => sum + d.value, 0);
  const avgMonthly = periodTotal / MONTHS_SHOWN;
  const bestMonth = chartData.reduce((best, d) => (d.value > best.value ? d : best), chartData[0]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <Link href="/orders" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-foreground">
          <TrendingUp className="h-6 w-6 text-primary" /> Sales Trend
        </h1>
        <p className="mt-1 text-sm text-muted">Monthly sales over the last {MONTHS_SHOWN} months{session.role === "SALES" ? " — your orders" : ""}.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={`Total (last ${MONTHS_SHOWN} mo.)`} value={formatPHP(periodTotal)} icon={TrendingUp} tone="success" />
        <StatTile label="Average per Month" value={formatPHP(avgMonthly)} icon={Calendar} tone="accent" />
        <StatTile label="Best Month" value={bestMonth ? `${bestMonth.label}` : "—"} icon={Award} tone="neutral" />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Monthly Sales</h2>
        <div className="mt-4">
          <MonthlyTrendChart data={chartData} barColor="#e08b2e" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Month</th>
              <th className="px-4 py-2.5 text-right font-medium">Orders</th>
              <th className="px-4 py-2.5 text-right font-medium">Sales</th>
            </tr>
          </thead>
          <tbody>
            {months
              .slice()
              .reverse()
              .map((m) => (
                <tr key={m.key} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/orders?month=${m.key}#all-orders`} className="font-medium text-foreground hover:text-accent hover:underline">
                      {m.label}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted">{countByMonth.get(m.key) ?? 0}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatPHP(totalsByMonth.get(m.key) ?? 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
