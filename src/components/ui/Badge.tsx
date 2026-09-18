import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-sky-50 text-sky-700",
  accent: "bg-accent-soft text-accent-hover",
  warning: "bg-warning-soft text-[#8a6d1a]",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[tone])} />}
      {children}
    </span>
  );
}

const DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-400",
  info: "bg-sky-500",
  accent: "bg-accent",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
};
