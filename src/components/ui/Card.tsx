import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const BORDER_CLASSES: Record<Tone, string> = {
  neutral: "border-l-slate-300",
  info: "border-l-sky-400",
  accent: "border-l-accent",
  warning: "border-l-warning",
  danger: "border-l-danger",
  success: "border-l-success",
};

export function Card({
  children,
  className,
  accentTone,
  as: Component = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  accentTone?: Tone;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Component
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm transition-shadow",
        accentTone && `border-l-4 ${BORDER_CLASSES[accentTone]}`,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
