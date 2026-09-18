import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PHP_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function formatPHP(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return PHP_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

const MANILA_TZ = "Asia/Manila";

export function formatManilaDate(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TZ, ...opts }).format(d);
}

export function formatManilaDateTime(date: Date | string): string {
  return formatManilaDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatManilaTime(date: Date | string): string {
  return formatManilaDate(date, { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
