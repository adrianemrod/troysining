import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProductForm } from "@/components/products/ProductForm";

export default async function NewProductPage() {
  const session = await getSession();
  if (!session || !["ADMIN", "SALES"].includes(session.role)) redirect("/products");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <Link href="/products" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Add Product</h1>
      </div>
      <Card className="p-6">
        <ProductForm />
      </Card>
    </div>
  );
}
