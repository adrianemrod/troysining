import Link from "next/link";
import { Package, Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { formatPHP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) return null;

  const products = await prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  const canManage = ["ADMIN", "SALES"].includes(session.role);

  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted">Catalog of printing products and services with pricing and turnaround.</p>
        </div>
        {canManage && (
          <LinkButton href="/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </LinkButton>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add your first printing product or service to start building quotations." />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{category}</h2>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-2.5 font-medium">Product</th>
                      <th className="px-4 py-2.5 font-medium">Unit Price</th>
                      <th className="px-4 py-2.5 font-medium">Turnaround</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      {canManage && <th className="px-4 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-canvas/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{p.name}</p>
                          {p.specs && <p className="text-xs text-muted">{p.specs}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {formatPHP(Number(p.unitPrice))} <span className="text-xs text-muted">/ {p.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{p.turnaroundDays} day{p.turnaroundDays === 1 ? "" : "s"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                        </td>
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            <Link href={`/products/${p.id}/edit`} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
