import { 
  getOutstandingBalances,
  getTopProducts,
  getLowStockAlerts
} from "@/modules/reports/actions";
import { ReportsClient } from "@/modules/reports/components/reports-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { PageShell } from "@/components/dashboard/page-shell";
import { getCurrentTenantContext } from "@/lib/tenant";
import { canUseFeature } from "@/lib/billing/enforcement";

export default async function ReportsPage() {
  const ctx = await getCurrentTenantContext();
  const canViewAdvancedTrends = await canUseFeature(ctx.organizationId, "advancedReports");
  const [balances, topProducts, lowStock] = await Promise.all([
    getOutstandingBalances(),
    getTopProducts(5),
    getLowStockAlerts()
  ]);

  return (
    <PageShell
      title="Reports"
      description="Review organization performance, inventory exceptions, and revenue insights with one consistent analytics surface."
      actions={
        <button className="flex h-10 items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-soft transition-all hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-[18px]">print</span>
          Print Summary
        </button>
      }
      className="pb-20"
    >

      {/* Main Interactive Analytics Section */}
      <ReportsClient canViewAdvancedTrends={canViewAdvancedTrends} />

      {/* Static Insights Grid */}
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-10 md:grid-cols-2">
           {/* Top Products */}
           <Card className="rounded-3xl shadow-soft">
              <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
                 <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                   Market Winners
                 </CardTitle>
                 <CardDescription className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Top revenue generators</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                  {topProducts.map(p => (
                    <div key={p.productId} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/20 border border-outline-variant/30 hover:border-primary/30 transition-all group">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-on-surface tracking-tight group-hover:text-primary transition-colors">{p.name}</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">{p.quantity} Units Shipped</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-on-surface">Rs. {p.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
           </Card>

           {/* Stock Summary Table */}
           <Card className="rounded-3xl shadow-soft">
              <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
                 <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                   <span className="material-symbols-outlined text-error text-[20px]">inventory_2</span>
                   Supply Deficit
                 </CardTitle>
                 <CardDescription className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Restocking protocols needed</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                  {lowStock.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-error/5 border border-error/10 group">
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-on-surface group-hover:text-error transition-colors uppercase tracking-tight">{item.product.name}</span>
                        <span className="text-[10px] font-black text-error/60 tracking-widest uppercase mt-0.5">Threshold: {item.product.lowStockThreshold}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-error">{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {lowStock.length === 0 && (
                    <div className="py-10 text-center space-y-3">
                      <span className="material-symbols-outlined text-secondary text-4xl opacity-20">check_circle</span>
                      <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant italic">All supply chains optimized.</p>
                    </div>
                  )}
              </CardContent>
           </Card>
        </div>

        <div className="space-y-10">
          {/* Outstanding Balances */}
          <Card className="rounded-3xl shadow-soft">
            <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                Capital Matrix
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Asset & Liability Triage</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span> Accounts Receivable
                </p>
                <div className="space-y-2">
                  {balances.customerBalances.map((cb, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                      <span className="text-on-surface-variant font-bold">{cb.name}</span>
                      <span className="font-black text-secondary">Rs. {cb.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">trending_down</span> Accounts Payable
                </p>
                <div className="space-y-2">
                  {balances.supplierBalances.map((sb, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-error/5 border border-error/10">
                      <span className="text-on-surface-variant font-bold">{sb.name}</span>
                      <span className="font-black text-error">Rs. {sb.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logic Summary Footer */}
          <Card className="rounded-3xl bg-error/5 border-error/20 p-6 space-y-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[28px]">report_problem</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-error">Operational Risk</p>
                <p className="text-xs font-black text-on-surface">{lowStock.length} Supply Exceptions</p>
              </div>
            </div>
            <Link href="/dashboard/inventory" className="w-full h-11 bg-error text-on-error rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-error/20 flex items-center justify-center gap-2 group hover:opacity-90">
              Authorize Replenishment <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </Link>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

