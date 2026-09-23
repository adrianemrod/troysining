import type { VatType } from "@prisma/client";

export const VAT_RATE = 0.12;

export function computeOrderTotals(subtotal: number, vatType: VatType): { vatAmount: number; totalAmount: number } {
  const vatAmount = vatType === "VAT" ? Math.round(subtotal * VAT_RATE * 100) / 100 : 0;
  return { vatAmount, totalAmount: subtotal + vatAmount };
}
