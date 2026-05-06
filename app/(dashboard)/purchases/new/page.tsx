// app/(dashboard)/purchases/new/page.tsx
import React from "react";
import { getSuppliers } from "@/modules/suppliers/actions";
import { getProducts } from "@/modules/products/actions";
import { PurchaseForm } from "@/modules/purchases/components/purchase-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPurchasePage() {
  const [suppliers, products] = await Promise.all([
    getSuppliers(),
    getProducts()
  ]);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/purchases" 
            className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 hover:text-on-surface transition-colors mb-2"
          >
            <ChevronLeft className="w-3 h-3" /> Back to Manifests
          </Link>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface uppercase">Inbound Manifest</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Validating stock integration and establishing supplier liability
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
        <PurchaseForm suppliers={suppliers} products={products} />
      </div>

      <div className="text-center pb-10">
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
          Inventory Pipeline System v2.1 • Audit Log Active
        </p>
      </div>
    </div>
  );
}

