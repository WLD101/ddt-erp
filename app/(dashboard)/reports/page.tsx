// app/(dashboard)/reports/page.tsx
import { 
  getOutstandingBalances,
  getTopProducts,
  getLowStockAlerts
} from "@/modules/reports/actions";
import { ReportsClient } from "@/modules/reports/components/reports-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Building,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const [balances, topProducts, lowStock] = await Promise.all([
    getOutstandingBalances(),
    getTopProducts(5),
    getLowStockAlerts()
  ]);

  return (
    <div className="p-8 space-y-8 flex-1 h-full overflow-auto bg-gradient-to-b from-background to-slate-900/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Analytics Terminal
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Strategic institutional intelligence for organization health.
          </p>
        </div>
      </div>

      {/* Main Interactive Analytics Section */}
      <ReportsClient />

      {/* Static Insights Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-8 md:grid-cols-2">
           {/* Top Products */}
           <Card className="border-white/5 bg-background/50 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                 <CardTitle className="text-lg">Top Performers</CardTitle>
                 <CardDescription>Highest revenue generators</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="space-y-4">
                    {topProducts.map(p => (
                      <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="flex flex-col">
                          <span className="font-bold sm:text-base text-sm group-hover:text-primary transition-colors">{p.name}</span>
                          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{p._sum.quantity} Units Sold</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">${p._sum.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           {/* Stock Summary Table */}
           <Card className="border-white/5 bg-background/50 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                 <CardTitle className="text-lg">Inventory Pulse</CardTitle>
                 <CardDescription>Critical restocking needed</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="space-y-4">
                    {lowStock.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 group">
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">{item.product.name}</span>
                          <span className="text-[10px] font-black text-rose-500/60 tracking-widest uppercase">Limit: {item.product.lowStockThreshold}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-rose-500">{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                    {lowStock.length === 0 && (
                      <p className="text-center py-8 text-sm text-muted-foreground italic">All supply chains are optimal.</p>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
          {/* Outstanding Balances */}
          <Card className="border-white/5 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-lg">Liquidity Matrix</CardTitle>
              <CardDescription>Unpaid internal & external balances</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center">
                  <Users className="w-3.5 h-3.5 mr-2" /> AR (Accounts Receivable)
                </p>
                <div className="space-y-2">
                  {balances.customerBalances.map((cb, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-muted-foreground font-medium">{cb.name}</span>
                      <span className="font-black text-emerald-400/90">${cb.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-2" /> AP (Accounts Payable)
                </p>
                <div className="space-y-2">
                  {balances.supplierBalances.map((sb, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-muted-foreground font-medium">{sb.name}</span>
                      <span className="font-black text-rose-400/90">${sb.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Summary Footer */}
          <Card className="border-white/5 bg-destructive/5 backdrop-blur-sm border-l-4 border-l-destructive shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">System Alert</p>
                  <p className="text-xs font-medium opacity-80">{lowStock.length} Low Stock Incidents</p>
                </div>
              </div>
              <Link href="/inventory" className="w-full py-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-xs font-bold text-destructive transition-all flex items-center justify-center gap-2 group">
                Access Logistics <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
