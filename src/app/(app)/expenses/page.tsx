import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Plus, Pencil, TrendingDown, Receipt, LineChart, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/dashboard/StatTile";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { formatManilaDate, formatPHP, cn } from "@/lib/utils";
import { currentManilaMonth, monthRangeManila, monthLabelManila } from "@/lib/analytics";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ category?: string; month?: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/dashboard");

  const { category, month } = await searchParams;
  const currentMonth = currentManilaMonth();
  const { start: monthStart } = monthRangeManila(currentMonth);

  const listWhere: Prisma.ExpenseWhereInput = {};
  if (category) listWhere.category = category;
  if (month) {
    const { start, end } = monthRangeManila(month);
    listWhere.date = { gte: start, lt: end };
  }

  const [expenses, allTimeCount, monthlyAgg, categoryAgg, allCategories] = await Promise.all([
    prisma.expense.findMany({
      where: listWhere,
      include: { recordedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.expense.count(),
    prisma.expense.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ["category"], _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } } }),
    prisma.expense.findMany({ distinct: ["category"], select: { category: true } }),
  ]);

  const grandTotal = categoryAgg.reduce((sum, c) => sum + Number(c._sum.amount ?? 0), 0);

  const filterLabel = [month ? monthLabelManila(month) : null, category ?? null].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Wallet className="h-6 w-6 text-primary" /> Expense Tracker
          </h1>
          <p className="mt-1 text-sm text-muted">Track shop expenses — materials, rent, utilities, payroll, and more.</p>
        </div>
        <LinkButton href="/expenses/new">
          <Plus className="h-4 w-4" /> Add Expense
        </LinkButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="This Month"
          value={formatPHP(Number(monthlyAgg._sum.amount ?? 0))}
          icon={TrendingDown}
          tone="danger"
          href="/expenses/analytics"
        />
        <StatTile
          label="Expenses This Month"
          value={monthlyAgg._count}
          icon={Receipt}
          tone="accent"
          href={`/expenses?month=${currentMonth}#all-expenses`}
        />
        <StatTile label="All-Time Total" value={formatPHP(grandTotal)} icon={Wallet} tone="neutral" href="/expenses#all-expenses" />
      </div>

      <LinkButton href="/expenses/analytics" variant="outline" size="sm" className="w-fit">
        <LineChart className="h-4 w-4" /> View monthly expense trend
      </LinkButton>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">By Category</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/expenses"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              !category ? "bg-primary text-white" : "bg-canvas text-muted border border-border hover:bg-slate-50"
            )}
          >
            All
          </Link>
          {allCategories.map((c) => (
            <Link
              key={c.category}
              href={`/expenses?category=${encodeURIComponent(c.category)}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                category === c.category ? "bg-primary text-white" : "bg-canvas text-muted border border-border hover:bg-slate-50"
              )}
            >
              {c.category}
            </Link>
          ))}
        </div>
        <ol className="mt-4 space-y-2">
          {categoryAgg.map((c, i) => (
            <li key={c.category} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">{i + 1}</span>
                {c.category}
              </span>
              <span className="font-medium">{formatPHP(Number(c._sum.amount ?? 0))}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div id="all-expenses" className="scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {filterLabel ? `Expenses — ${filterLabel}` : "All Expenses"} ({expenses.length} of {allTimeCount})
          </h2>
          {(month || category) && (
            <Link href="/expenses#all-expenses" className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
              <X className="h-3.5 w-3.5" /> Clear filters
            </Link>
          )}
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={filterLabel ? `No expenses for ${filterLabel}` : "No expenses recorded"}
            description={filterLabel ? "Try a different month or category, or clear the filters." : "Add your first expense to start tracking shop costs."}
          />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-canvas/60">
                    <td className="px-4 py-3 text-muted">{formatManilaDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{e.description}</p>
                      {e.paymentMethod && <p className="text-xs text-muted">{e.paymentMethod}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{e.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{e.vendor || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPHP(Number(e.amount))}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/expenses/${e.id}/edit`} className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-accent hover:bg-accent-soft">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <DeleteButton
                          endpoint={`/api/expenses/${e.id}`}
                          confirmMessage={`Delete the expense "${e.description}"? This cannot be undone.`}
                          iconOnly
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
