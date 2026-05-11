// app/(dashboard)/sales/new/page.tsx
import React from "react";
import { getCustomers } from "@/modules/customers/actions";
import { getProducts } from "@/modules/products/actions";
import { getInventoryItems } from "@/modules/inventory/actions";
import { SaleForm } from "@/modules/sales/components/sale-form";
import Link from "next/link";
import { getQuotationById } from "@/modules/quotations/actions";

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ fromQuote?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [rawCustomers, rawProducts, rawInventoryItems] = await Promise.all([
    getCustomers(),
    getProducts(),
    getInventoryItems(),
  ]);

  const customers = rawCustomers.map((c: any) => ({ id: c.id, name: c.name }));
  const inventoryByProductId = new Map<string, number>(
    rawInventoryItems.map((item: any) => [item.productId, item.quantity])
  );
  const products = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    unitPrice: p.unitPrice,
    availableQuantity: inventoryByProductId.get(p.id) ?? 0,
  }));

  let preData = null;
  if (resolvedSearchParams.fromQuote) {
    const quote = await getQuotationById(resolvedSearchParams.fromQuote);
    if (quote) {
      preData = {
        customerId: quote.customerId,
        quotationId: quote.id,
        items: quote.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        })),
        discount: quote.discount,
        notes: quote.notes,
        invoiceNumber: `INV-${(quote.quotationNumber ?? "QUOTE-000").split('-').pop()}`
      };
    }
  }

  return (
    <div className="space-y-8 flex-1 flex flex-col overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/sales" 
            className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2 hover:text-primary transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Manifests
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">New Sale Manifest</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Authorizing inventory allocation and customer billing session
          </p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-10 shadow-soft">
        <SaleForm customers={customers} products={products} initialData={preData} />
      </div>

      <div className="text-center pb-10">
        <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-[0.3em]">
          Production Ledger System v2.1 • Audit Log Active
        </p>
      </div>
    </div>
  );
}

