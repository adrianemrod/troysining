import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/status";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-primary-soft text-primary",
  info: "bg-sky-50 text-sky-700",
  accent: "bg-accent-soft text-accent-hover",
  warning: "bg-warning-soft text-[#8a6d1a]",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  href?: string;
}) {
  const content = (
    <>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}>
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted">{label}</p>
      </div>
    </>
  );

  const className = "flex items-center gap-3 rounded-xl border border-border bg-surface p-4";

  if (href) {
    return (
      <a href={href} className={cn(className, "transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-accent/40")}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
