import { getProducts, getCategories } from "@/modules/products/actions";
import { getCurrentTenantContext } from "@/lib/tenant";
import { ProductClient } from "./client";

export default async function ProductsPage() {
  const ctx = await getCurrentTenantContext();
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);
  const canImport = ["owner", "admin"].includes(ctx.role);

  return <ProductClient initialProducts={products} categories={categories} canImport={canImport} />;
}
