"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";

const CATEGORIES = [
  "Materials",
  "Rent",
  "Utilities",
  "Payroll",
  "Equipment Maintenance",
  "Transportation",
  "Marketing",
  "Office Supplies",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online Banking", "Credit Card", "GCash", "Other"];

interface ExpenseInput {
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor: string | null;
  paymentMethod: string | null;
  notes: string | null;
}

export function ExpenseForm({ initial }: { initial?: ExpenseInput }) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { date, category, description, amount: Number(amount), vendor, paymentMethod, notes };
    const res = await fetch(initial?.id ? `/api/expenses/${initial.id}` : "/api/expenses", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save expense.");
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="date" required>Date</Label>
          <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="category" required>Category</Label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="description" required>Description</Label>
          <Input id="description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tarpaulin roll stock (50m)" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="amount" required>Amount (₱)</Label>
          <Input id="amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="paymentMethod">Payment method</Label>
          <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="vendor">Vendor / Payee (optional)</Label>
          <Input id="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Manila Ink & Media Supply" />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save expense
      </Button>
    </form>
  );
}
