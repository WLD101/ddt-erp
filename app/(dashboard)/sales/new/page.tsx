// app/(dashboard)/sales/new/page.tsx
import React from "react";
import { getCustomers } from "@/modules/customers/actions";
import { getProducts } from "@/modules/products/actions";
import { SaleForm } from "@/modules/sales/components/sale-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getQuotationById } from "@/modules/quotations/actions";

export default async function NewSalePage({ searchParams }: { searchParams: { fromQuote?: string } }) {
  const [customers, products] = await Promise.all([
    getCustomers(),
    getProducts()
  ]);

  let preData = null;
  if (searchParams.fromQuote) {
    const quote = await getQuotationById(searchParams.fromQuote);
    if (quote) {
      preData = {
        customerId: quote.customerId,
        quotationId: quote.id,
        items: quote.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        })),
        discount: quote.discount,
        notes: quote.notes,
        invoiceNumber: `INV-${quote.quotationNumber.split('-').pop()}`
      };
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/sales" 
            className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-colors mb-2"
          >
            <ChevronLeft className="w-3 h-3" /> Back to Manifests
          </Link>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase">New Sale Manifest</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Authorizing inventory allocation and customer billing session
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
        <SaleForm customers={customers} products={products} initialData={preData} />
      </div>

      <div className="text-center pb-10">
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
          Production Ledger System v2.1 • Audit Log Active
        </p>
      </div>
    </div>
  );
}
