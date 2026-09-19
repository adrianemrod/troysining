"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Label, FieldGroup } from "@/components/ui/Field";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "DESIGN", label: "Design File" },
  { value: "PROOF", label: "Proof" },
  { value: "FINAL", label: "Approved Final" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "CONTRACT", label: "Contract" },
  { value: "FB_SCREENSHOT", label: "FB Chat Screenshot" },
  { value: "OTHER", label: "Other" },
];

export function UploadFileForm({ clientId, defaultCategory = "DESIGN" }: { clientId: string; defaultCategory?: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("clientId", clientId);
    form.set("category", category);
    form.set("file", file);

    const res = await fetch("/api/files", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    setFile(null);
    const input = document.getElementById("file-input") as HTMLInputElement | null;
    if (input) input.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-canvas p-3">
      {error && <p className="w-full text-sm text-danger">{error}</p>}
      <FieldGroup className="w-40">
        <Label htmlFor="category">Category</Label>
        <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup className="flex-1 min-w-[180px]">
        <Label htmlFor="file-input">File</Label>
        <input
          id="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
        />
      </FieldGroup>
      <Button type="submit" size="md" disabled={loading || !file}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        Upload
      </Button>
    </form>
  );
}
