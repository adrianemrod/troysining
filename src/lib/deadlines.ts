const MANILA_TZ = "Asia/Manila";

/** Returns the current date/time as a Date, but fields read via toLocaleString use Manila. */
function manilaDateParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD
  return fmt.format(date); // "2026-09-18"
}

/** Calendar-day difference between `date` and "now", both evaluated in Asia/Manila. */
export function manilaDayDiff(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const todayStr = manilaDateParts(new Date());
  const targetStr = manilaDateParts(target);

  const today = new Date(`${todayStr}T00:00:00Z`);
  const targetDay = new Date(`${targetStr}T00:00:00Z`);

  const diffMs = targetDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export type DeadlineBucket = "overdue" | "today" | "this_week" | "later";

/** `isDone` mutes the urgency framing (overdue/today) once the work is actually finished. */
export function bucketForDueDate(dueDate: Date | string, isDone = false): DeadlineBucket {
  if (isDone) return "later";
  const diff = manilaDayDiff(dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "this_week";
  return "later";
}

export function daysLabel(dueDate: Date | string, isDone = false): string {
  if (isDone) return "Completed";
  const diff = manilaDayDiff(dueDate);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

/** A production job is effectively finished once it's completed or staged for delivery pickup. */
export function isProductionDone(stage: string | null | undefined): boolean {
  return stage === "COMPLETED" || stage === "READY_FOR_DELIVERY";
}

/** Sort key: overdue first (most overdue first), then today, then this week, then later — all soonest first. */
export function deadlineSortValue(dueDate: Date | string): number {
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return date.getTime();
}

export const EARLY_STAGES = ["PENDING", "DESIGNING"] as const;

/** A job is "at risk" if it's still in an early production stage with less than 24h left, or already overdue. */
export function isAtRisk(dueDate: Date | string, stage: string, completed: boolean): boolean {
  if (completed) return false;
  const diff = manilaDayDiff(dueDate);
  if (diff < 0) return true;
  if (diff === 0 && (EARLY_STAGES as readonly string[]).includes(stage)) return true;
  return false;
}
