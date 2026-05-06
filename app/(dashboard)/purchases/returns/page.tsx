import { getPurchaseReturns } from "@/modules/returns/actions";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function PurchaseReturnsPage() {
  const returns = await getPurchaseReturns();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Supplier <span className="text-primary">Returns</span>
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-body-md">Reversing organizational procurements and reconciling external supplier nodes.</p>
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="rounded-[32px] border border-outline-variant/30 shadow-soft overflow-hidden bg-surface group">
           <CardHeader className="pb-4 bg-surface-container-lowest border-b border-outline-variant/10">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-[18px]">assignment_return</span> 
               Debited Valuation
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-8">
             <div className="text-3xl font-black text-on-surface tracking-tighter">
               Rs. {returns.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
             </div>
             <p className="text-[10px] text-on-surface-variant/60 font-bold mt-1 uppercase tracking-widest italic">Total value recovered from vendors</p>
           </CardContent>
         </Card>

         <Card className="rounded-[32px] border border-outline-variant/30 shadow-soft overflow-hidden bg-surface group">
           <CardHeader className="pb-4 bg-surface-container-lowest border-b border-outline-variant/10">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
               <span className="material-symbols-outlined text-secondary text-[18px]">verified</span> 
               Success Index
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-8">
             <div className="text-3xl font-black text-on-surface tracking-tighter">
               100%
             </div>
             <p className="text-[10px] text-on-surface-variant/60 font-bold mt-1 uppercase tracking-widest italic">Restock protocols validated</p>
           </CardContent>
         </Card>
      </div>

      {/* Returns List */}
      <div className="grid gap-6">
        {returns.length > 0 ? (
          returns.map((ret: any) => (
             <Link 
              href={`/purchases/${ret.purchaseInvoiceId}`} 
              key={ret.id}
              className="group block bg-surface border border-outline-variant/30 hover:border-primary/50 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md"
             >
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                     <div className="h-14 w-14 rounded-2xl bg-surface-container border border-outline-variant/10 flex items-center justify-center group-hover:bg-primary/5 transition-colors shadow-sm">
                       <span className="material-symbols-outlined text-primary text-[28px] group-hover:scale-110 transition-transform">local_shipping</span>
                     </div>
                     <div>
                       <h4 className="font-black text-on-surface text-lg tracking-tight group-hover:text-primary transition-colors font-headline-sm">{ret.returnNumber}</h4>
                       <div className="flex items-center gap-4 mt-1">
                         <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-60">
                           <span className="material-symbols-outlined text-[14px]">store</span> {ret.purchaseInvoice.supplier.name}
                         </span>
                         <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-60">
                           <span className="material-symbols-outlined text-[14px]">event</span> {format(new Date(ret.createdAt), "MMM dd, yyyy")}
                         </span>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <div className="text-right space-y-1">
                       <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Debit Reversal</p>
                       <p className="text-xl font-black text-primary tracking-tighter italic">Rs. -{ret.totalAmount.toLocaleString()}</p>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-outline-variant/10">
                       <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">arrow_forward</span>
                     </div>
                  </div>
               </div>
             </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-surface border border-dashed border-outline-variant/30 rounded-[40px] shadow-sm">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant/20">
              <span className="material-symbols-outlined text-4xl">keyboard_return</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-on-surface uppercase tracking-widest">No Outbound Returns Identified</p>
              <p className="text-[10px] font-medium text-on-surface-variant/60 italic">All procurements finalized. No supplier restock procedures active.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

