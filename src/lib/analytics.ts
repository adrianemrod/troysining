const MANILA_TZ = "Asia/Manila";

export interface MonthBucket {
  key: string; // "2026-09"
  label: string; // "Sep 2026"
}

/** Returns the last `count` months (oldest first) ending with the current Manila month, as "YYYY-MM" keys. */
export function lastNMonths(count: number): MonthBucket[] {
  const now = new Date();
  const currentKey = new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ, year: "numeric", month: "2-digit" }).format(now);
  const [curYear, curMonth] = currentKey.split("-").map(Number);

  const months: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    let year = curYear;
    let month = curMonth - i;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TZ, year: "numeric", month: "short" }).format(
      new Date(`${key}-01T00:00:00+08:00`)
    );
    months.push({ key, label });
  }
  return months;
}

/** Manila-local "YYYY-MM" for a given date, for bucketing records into a month. */
export function manilaMonthKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ, year: "numeric", month: "2-digit" }).format(d);
}

/** Start of the Manila month `count - 1` months before the current one, as a UTC Date usable in a `gte` filter. */
export function monthsAgoStart(count: number): Date {
  const months = lastNMonths(count);
  return new Date(`${months[0].key}-01T00:00:00+08:00`);
}

/** Current Manila month as "YYYY-MM". */
export function currentManilaMonth(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ, year: "numeric", month: "2-digit" }).format(new Date());
}

/** [start, end) UTC Date range for a given "YYYY-MM" Manila month, usable in a `gte`/`lt` filter. */
export function monthRangeManila(monthStr: string): { start: Date; end: Date } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(`${monthStr}-01T00:00:00+08:00`);
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const end = new Date(`${nextMonth}-01T00:00:00+08:00`);
  return { start, end };
}

/** Human label for a "YYYY-MM" Manila month, e.g. "September 2026". */
export function monthLabelManila(monthStr: string): string {
  const { start } = monthRangeManila(monthStr);
  return new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TZ, year: "numeric", month: "long" }).format(start);
}
