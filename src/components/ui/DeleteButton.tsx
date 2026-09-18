"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteButton({
  endpoint,
  confirmMessage,
  redirectTo,
  label = "Delete",
  className,
  iconOnly = false,
}: {
  endpoint: string;
  confirmMessage: string;
  redirectTo?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(endpoint, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete.");
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-50",
          iconOnly ? "p-1.5" : "px-3 py-2",
          className
        )}
        title={label}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {!iconOnly && label}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
