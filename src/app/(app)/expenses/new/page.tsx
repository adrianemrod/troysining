import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/expenses");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href="/expenses" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Expenses
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Add Expense</h1>
      </div>
      <Card className="p-6">
        <ExpenseForm />
      </Card>
    </div>
  );
}
