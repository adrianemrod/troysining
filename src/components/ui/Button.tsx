import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-accent text-white hover:bg-accent-hover",
  outline: "border border-border bg-surface text-foreground hover:bg-slate-50",
  ghost: "text-foreground hover:bg-slate-100",
  danger: "bg-danger text-white hover:brightness-95",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...rest} />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...rest} />
  );
}
