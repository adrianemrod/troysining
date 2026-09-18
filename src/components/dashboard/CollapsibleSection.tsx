"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  id,
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id) return;
    const checkHash = () => {
      if (window.location.hash === `#${id}`) setOpen(true);
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [id]);

  return (
    <section id={id} className="scroll-mt-24">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-left hover:bg-slate-50"
      >
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {title} <span className="ml-1 text-sm font-normal text-muted">({count})</span>
          </h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4 animate-fade-in">{children}</div>}
    </section>
  );
}
