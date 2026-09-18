"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { formatPHP } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
  businessName: string | null;
}
interface ProductOption {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}
interface SalesOption {
  id: string;
  name: string;
}

interface ItemRow {
  productId: string;
  quantity: number;
  specs: string;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 16);
}

export function OrderForm({
  clientOptions,
  productOptions,
  salesOptions,
  currentUserId,
  isAdmin,
  preselectedClientId,
}: {
  clientOptions: ClientOption[];
  productOptions: ProductOption[];
  salesOptions: SalesOption[];
  currentUserId: string;
  isAdmin: boolean;
  preselectedClientId?: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(preselectedClientId ?? clientOptions[0]?.id ?? "");
  const [salespersonId, setSalespersonId] = useState(currentUserId);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [downpayment, setDownpayment] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ productId: productOptions[0]?.id ?? "", quantity: 1, specs: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(productOptions.map((p) => [p.id, p])), [productOptions]);
  const total = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product ? product.unitPrice * item.quantity : 0);
  }, 0);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { productId: productOptions[0]?.id ?? "", quantity: 1, specs: "" }]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        salespersonId,
        dueDate: new Date(dueDate).toISOString(),
        downpayment: Number(downpayment),
        notes,
        items: items.filter((i) => i.productId),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create order.");
      return;
    }
    router.push(`/orders/${data.order.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="client" required>Client</Label>
          <Select id="client" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.businessName || c.name}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="dueDate" required>Due date & time</Label>
          <Input id="dueDate" type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FieldGroup>
        {isAdmin && (
          <FieldGroup>
            <Label htmlFor="salesperson">Salesperson</Label>
            <Select id="salesperson" value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)}>
              {salesOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FieldGroup>
        )}
        <FieldGroup>
          <Label htmlFor="downpayment">Downpayment (₱)</Label>
          <Input id="downpayment" type="number" min="0" step="0.01" value={downpayment} onChange={(e) => setDownpayment(e.target.value)} />
        </FieldGroup>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Order items</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => {
            const product = productMap.get(item.productId);
            const subtotal = product ? product.unitPrice * item.quantity : 0;
            return (
              <div key={index} className="grid grid-cols-12 items-start gap-2 rounded-lg border border-border p-3">
                <div className="col-span-12 sm:col-span-5">
                  <Select value={item.productId} onChange={(e) => updateItem(index, { productId: e.target.value })}>
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({formatPHP(p.unitPrice)}/{p.unit})</option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
                <div className="col-span-8 sm:col-span-3">
                  <Input placeholder="Specs (optional)" value={item.specs} onChange={(e) => updateItem(index, { specs: e.target.value })} />
                </div>
                <div className="col-span-10 sm:col-span-1 flex items-center text-sm font-medium text-foreground pt-2">
                  {formatPHP(subtotal)}
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-end pt-1">
                  <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="text-muted hover:text-danger disabled:opacity-30">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FieldGroup>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions, references, etc." />
      </FieldGroup>

      <div className="flex items-center justify-between rounded-lg bg-primary-soft px-4 py-3">
        <span className="text-sm font-medium text-primary">Order Total</span>
        <span className="text-lg font-bold text-primary">{formatPHP(total)}</span>
      </div>

      <Button type="submit" disabled={loading || !clientId}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create order
      </Button>
    </form>
  );
}
