"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";

interface ProductInput {
  id?: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  turnaroundDays: number;
  specs: string | null;
  isActive: boolean;
}

const CATEGORIES = ["Signage", "Print Collateral", "Stickers & Labels", "Packaging", "Promotional", "Apparel"];

export function ProductForm({ initial }: { initial?: ProductInput }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "piece");
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice?.toString() ?? "");
  const [turnaroundDays, setTurnaroundDays] = useState(initial?.turnaroundDays?.toString() ?? "3");
  const [specs, setSpecs] = useState(initial?.specs ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { name, category, description, unit, unitPrice: Number(unitPrice), turnaroundDays: Number(turnaroundDays), specs, isActive };
    const res = await fetch(initial?.id ? `/api/products/${initial.id}` : "/api/products", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save product.");
      return;
    }
    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="name" required>Product name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarpaulin Print (Standard)" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="category" required>Category</Label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="sqft, piece, box..." />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="unitPrice" required>Unit price (₱)</Label>
          <Input id="unitPrice" type="number" min="0" step="0.01" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="turnaroundDays" required>Turnaround (days)</Label>
          <Input id="turnaroundDays" type="number" min="1" required value={turnaroundDays} onChange={(e) => setTurnaroundDays(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="isActive">Status</Label>
          <Select id="isActive" value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="specs">Specs</Label>
        <Input id="specs" value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="Glossy or matte, eyelets included" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </FieldGroup>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save product
      </Button>
    </form>
  );
}
