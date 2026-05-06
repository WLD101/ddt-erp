import { getProducts, getCategories } from "@/modules/products/actions";
import { ProductClient } from "./client";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return <ProductClient initialProducts={products} categories={categories} />;
}
