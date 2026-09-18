import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProductForm } from "@/components/products/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/products");

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href="/products" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Edit Product</h1>
      </div>
      <Card className="p-6">
        <ProductForm
          initial={{
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            unit: product.unit,
            unitPrice: Number(product.unitPrice),
            turnaroundDays: product.turnaroundDays,
            specs: product.specs,
            isActive: product.isActive,
          }}
        />
      </Card>
    </div>
  );
}
