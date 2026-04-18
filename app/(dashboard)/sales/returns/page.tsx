import { getSalesReturns } from "@/modules/returns/actions";
import { 
  RotateCcw, 
  Calendar, 
  User, 
  Hash, 
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  BadgeAlert
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default async function SalesReturnsPage() {
  const returns = await getSalesReturns();

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/20 rounded-xl">
               <RotateCcw className="w-5 h-5 text-primary" />
             </div>
             <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
               Client <span className="text-primary">Returns</span>
             </h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Reversing sales, restoring stock, and reconciling credits.</p>
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white/5 border-white/5 shadow-xl glass-morphism rounded-3xl overflow-hidden relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               <ShoppingBag className="w-3 h-3 text-primary" /> Total Reversed
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-3xl font-black text-white italic tracking-tighter">
               ${returns.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
             </div>
             <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Total value of all restocked goods</p>
           </CardContent>
         </Card>

         <Card className="bg-white/5 border-white/5 shadow-xl glass-morphism rounded-3xl overflow-hidden relative group">
           <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               <TrendingDown className="w-3 h-3 text-orange-500" /> Return Events
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-3xl font-black text-white italic tracking-tighter">
               {returns.length}
             </div>
             <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Historical return transactions</p>
           </CardContent>
         </Card>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {returns.length > 0 ? (
          returns.map((ret: any) => (
             <Link 
              href={`/sales/${ret.salesInvoiceId}`} 
              key={ret.id}
              className="group block bg-white/[0.03] border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden"
             >
               <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Hash className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-lg tracking-tight group-hover:text-primary transition-colors">{ret.returnNumber}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <User className="w-3 h-3" /> {ret.salesInvoice.customer.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Calendar className="w-3 h-3" /> {format(new Date(ret.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-8">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Credit Reversal</p>
                      <p className="text-xl font-black text-primary italic">-${ret.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                 </div>
               </div>
             </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <div className="p-5 bg-white/5 rounded-full">
              <RotateCcw className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-white uppercase tracking-widest">No Returns Processed</p>
              <p className="text-xs text-muted-foreground">All sales remain healthy and finalized.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
