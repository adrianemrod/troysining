import { initials, cn } from "@/lib/utils";

export function Avatar({
  name,
  color = "#1f3f5b",
  size = "md",
  className,
}: {
  name: string;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  }[size];

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizeClasses, className)}
      style={{ backgroundColor: color ?? "#1f3f5b" }}
    >
      {initials(name) || "?"}
    </div>
  );
}
