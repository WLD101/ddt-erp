"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext } from "@/lib/tenant";

export type SearchResult = {
  id: string;
  type: "customer" | "product" | "sale" | "action";
  title: string;
  subtitle?: string;
  url: string;
};

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const ctx = await getCurrentTenantContext();
  const q = query.toLowerCase();

  const [customers, products, sales] = await Promise.all([
    prisma.customer.findMany({
      where: {
        organizationId: ctx.organizationId,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, phone: true },
    }),
    prisma.product.findMany({
      where: {
        organizationId: ctx.organizationId,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, sku: true, unitPrice: true },
    }),
    prisma.salesInvoice.findMany({
      where: {
        organizationId: ctx.organizationId,
        invoiceNumber: { contains: q },
      },
      take: 5,
      select: { id: true, invoiceNumber: true, totalAmount: true, customer: { select: { name: true } } },
    }),
  ]);

  const results: SearchResult[] = [];

  // Actions (Static)
  const actions: SearchResult[] = [
    { id: "action-sale", type: "action" as const, title: "New Sale Manifest", subtitle: "Record a new sale", url: "/sales/new" },
    { id: "action-product", type: "action" as const, title: "Add New Product", subtitle: "Register SKU in inventory", url: "/products/new" },
  ].filter(a => a.title.toLowerCase().includes(q));
  results.push(...actions);

  // Map Entities
  results.push(...customers.map(c => ({
    id: c.id,
    type: "customer" as const,
    title: c.name,
    subtitle: c.phone || "Customer",
    url: `/customers/${c.id}`,
  })));

  results.push(...products.map(p => ({
    id: p.id,
    type: "product" as const,
    title: p.name,
    subtitle: p.sku ? `SKU: ${p.sku} • Rs. ${p.unitPrice}` : `Rs. ${p.unitPrice}`,
    url: `/products/${p.id}`,
  })));

  results.push(...sales.map(s => ({
    id: s.id,
    type: "sale" as const,
    title: s.invoiceNumber,
    subtitle: `${s.customer.name} • Rs. ${s.totalAmount}`,
    url: `/sales/${s.id}`,
  })));

  return results;
}
