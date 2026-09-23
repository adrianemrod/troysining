import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatManilaDate, formatPHP } from "@/lib/utils";
import { PrintButton } from "@/components/orders/PrintButton";

export const dynamic = "force-dynamic";

export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { client: true, salesperson: true, items: { include: { product: true } } },
  });
  if (!order) notFound();

  const totalAmount = Number(order.totalAmount);
  const vatAmount = Number(order.vatAmount);
  const subtotal = totalAmount - vatAmount;
  const downpayment = Number(order.downpayment);
  const balance = totalAmount - downpayment;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-border p-8 print:rounded-none print:border-0">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Troysining Printing Services" width={64} height={64} />
            <div>
              <p className="text-lg font-bold text-primary">Troysining Printing Services</p>
              <p className="text-xs text-muted">Philippines &middot; troysining.ph</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">QUOTATION</p>
            <p className="text-sm text-muted">{order.orderNumber}</p>
            <p className="text-sm text-muted">{formatManilaDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Billed to</p>
            <p className="mt-1 font-medium text-foreground">{order.client.businessName || order.client.name}</p>
            {order.client.businessName && <p className="text-muted">{order.client.name}</p>}
            {order.client.address && <p className="text-muted">{order.client.address}</p>}
            {order.client.contactNumber && <p className="text-muted">{order.client.contactNumber}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Due Date</p>
            <p className="mt-1 font-medium text-foreground">{formatManilaDate(order.dueDate)}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Prepared by</p>
            <p className="font-medium text-foreground">{order.salesperson.name}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2">Product</th>
              <th className="pb-2">Specs</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit Price</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2.5">{item.product?.name ?? item.customName}</td>
                <td className="py-2.5 text-muted">{item.specs || "—"}</td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                <td className="py-2.5 text-right">{formatPHP(Number(item.unitPrice))}</td>
                <td className="py-2.5 text-right font-medium">{formatPHP(Number(item.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-medium">{formatPHP(subtotal)}</span></div>
            {order.vatType === "VAT" && (
              <div className="flex justify-between"><span className="text-muted">VAT (12%)</span><span className="font-medium">{formatPHP(vatAmount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-medium">{formatPHP(totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Downpayment</span><span className="font-medium">{formatPHP(downpayment)}</span></div>
            <div className="flex justify-between border-t border-primary pt-1.5 text-base"><span className="font-bold">Balance Due</span><span className="font-bold text-primary">{formatPHP(balance)}</span></div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-8 border-t border-border pt-4 text-sm text-muted">
            <span className="font-medium text-foreground">Notes: </span>
            {order.notes}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-light">Thank you for choosing Troysining Printing Services!</p>
      </div>
    </div>
  );
}
