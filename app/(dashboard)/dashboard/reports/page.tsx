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
import { AlertCircle } from "lucide-react";

export default async function ReportsPage() {
  const ctx = await getCurrentTenantContext();
  const canViewReports = ctx.role === "owner" || ctx.permissions.includes("reports.view");

  if (!canViewReports) {
    return (
      <PageShell
        title="Reports"
        description="Review organization performance, inventory exceptions, and revenue insights with one consistent analytics surface."
        className="pb-20"
      >
        <Card className="rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-on-surface">
              <AlertCircle className="h-4 w-4 text-primary" />
              Reports unavailable
            </CardTitle>
            <CardDescription className="text-sm font-medium text-on-surface-variant">
              Your current workspace role cannot view reports right now. Contact your workspace administrator if you need access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-6 text-on-surface-variant">
              This safe state prevents dashboard crashes while keeping tenant data protected and access rules intact.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Return to dashboard
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const canViewAdvancedTrends = await canUseFeature(ctx.organizationId, "advancedReports");
  let balances: Awaited<ReturnType<typeof getOutstandingBalances>> = { customerBalances: [], supplierBalances: [] };
  let topProducts: Awaited<ReturnType<typeof getTopProducts>> = [];
  let lowStock: Awaited<ReturnType<typeof getLowStockAlerts>> = [];
  let loadWarning: string | null = null;

  try {
    [balances, topProducts, lowStock] = await Promise.all([
      getOutstandingBalances(),
      getTopProducts(5),
      getLowStockAlerts(),
    ]);
  } catch (error) {
    console.error("[reports-page] failed to load static report widgets", {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      error,
    });
    loadWarning = "We couldn't load every report widget right now. Core reporting is still available below.";
  }

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
      {loadWarning ? (
        <Card className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 shadow-soft">
          <CardContent className="flex items-start gap-3 p-5 text-sm text-on-surface">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="font-medium text-on-surface-variant">{loadWarning}</p>
          </CardContent>
        </Card>
      ) : null}

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

