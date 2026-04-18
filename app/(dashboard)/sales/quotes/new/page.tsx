import React from "react";
import { getCustomers } from "@/modules/customers/actions";
import { getProducts } from "@/modules/products/actions";
import { QuotationForm } from "@/modules/quotations/components/quotation-form";
import { ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function NewQuotationPage() {
  const [customers, products] = await Promise.all([
    getCustomers(),
    getProducts()
  ]);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link 
            href="/sales/quotes" 
            className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 hover:text-indigo-400 transition-colors mb-4 group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Quotations Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-1 flex bg-indigo-500 rounded-full" />
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Generate <span className="text-indigo-500">Proposal</span></h2>
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1">
                Drafting commercial terms for institutional engagement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-2xl shadow-3xl shadow-indigo-500/5">
        <QuotationForm customers={customers} products={products} />
      </div>

      <div className="pt-10 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
         <div className="h-px w-20 bg-white/10" />
         <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">Quotation Engine v1.0 • Non-Binding Session</p>
         <div className="h-px w-20 bg-white/10" />
      </div>
    </div>
  );
}
