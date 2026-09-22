import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/expenses");

  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href="/expenses" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Expenses
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Edit Expense</h1>
      </div>
      <Card className="p-6">
        <ExpenseForm
          initial={{
            id: expense.id,
            date: expense.date.toISOString().slice(0, 10),
            category: expense.category,
            description: expense.description,
            amount: Number(expense.amount),
            vendor: expense.vendor,
            paymentMethod: expense.paymentMethod,
            notes: expense.notes,
          }}
        />
      </Card>
    </div>
  );
}
