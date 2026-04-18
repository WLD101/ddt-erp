import { getProducts, getCategories } from "@/modules/products/actions";
import { ProductClient } from "./client";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <ProductClient initialProducts={products} categories={categories} />
    </div>
  );
}
