import { 
  getDashboardMetrics, 
  getLowStockAlerts, 
  getTopProducts, 
  getChartData,
  getBusinessHealthScore,
  getTodaysBusinessSummary,
  getEcommerceIntelligence,
  getEcommerceSyncSummary,
} from "@/modules/reports/actions";
import { RevenueChart } from "@/modules/reports/components/revenue-chart";
import { DashboardShowcaseWidgets } from "@/modules/reports/components/dashboard-showcase-widgets";
import { EcommerceIntelligence } from "@/modules/reports/components/ecommerce-intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { triggerNotificationPulse } from "@/modules/notifications/actions";
import { auth } from "@/lib/auth";
import { getCurrentTenantContext } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const ctx = await getCurrentTenantContext();
  const canViewReports = ctx.role === "owner" || ctx.permissions.includes("reports.view");
  const canCreateSales = ctx.role === "owner" || ctx.permissions.includes("sales.create");
  const canExportAudit = ctx.role === "owner" || (ctx.permissions.includes("audit.view") && ["owner", "admin"].includes(ctx.role));

  triggerNotificationPulse().catch(console.error);

  let dashboardData:
    | {
        metrics: Awaited<ReturnType<typeof getDashboardMetrics>>;
        lowStock: Awaited<ReturnType<typeof getLowStockAlerts>>;
        topProducts: Awaited<ReturnType<typeof getTopProducts>>;
        chartData: Awaited<ReturnType<typeof getChartData>>;
        businessHealth: Awaited<ReturnType<typeof getBusinessHealthScore>>;
        todaySummary: Awaited<ReturnType<typeof getTodaysBusinessSummary>>;
        ecommerceSyncSummary: Awaited<ReturnType<typeof getEcommerceSyncSummary>>;
        ecommerceIntelligence: Awaited<ReturnType<typeof getEcommerceIntelligence>>;
      }
    | null = null;

  if (canViewReports) {
    try {
      const [metrics, lowStock, topProducts, chartData, businessHealth, todaySummary, ecommerceSyncSummary, ecommerceIntelligence] = await Promise.all([
        getDashboardMetrics(),
        getLowStockAlerts(),
        getTopProducts(),
        getChartData(),
        getBusinessHealthScore(),
        getTodaysBusinessSummary(),
        getEcommerceSyncSummary(),
        getEcommerceIntelligence(),
      ]);

      dashboardData = {
        metrics,
        lowStock,
        topProducts,
        chartData,
        businessHealth,
        todaySummary,
        ecommerceSyncSummary,
        ecommerceIntelligence,
      };
    } catch (error) {
      console.error("[dashboard] failed to load analytics workspace", {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        role: ctx.role,
        error,
      });
    }
  }

  return (
    <div className="space-y-8 flex-1 overflow-auto pb-10">
      <Card className="overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(135deg,rgba(21,65,183,0.08),rgba(255,255,255,0.98)_42%,rgba(21,65,183,0.04))] shadow-soft">
        <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              Smart Assistant
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md sm:text-[2rem]">
                Ask anything to your agent here
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-medium text-on-surface-variant font-body-md">
                Create customers, draft invoices, stock updates, and reports with a guided assistant that previews every action before it runs.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/dashboard/assistant"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black tracking-wide text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90"
            >
              Open Smart Assistant
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline-md">Business Intelligence</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Welcome back, {session?.user?.name || "Admin"}. Here's your enterprise status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canExportAudit ? (
            <a
              href="/api/export/audit-logs"
              download
              className="flex items-center gap-2 px-4 h-10 bg-surface border border-outline-variant text-on-surface font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Audit
            </a>
          ) : null}
          {canCreateSales ? (
            <Link
              href="/sales/new"
              className="flex items-center gap-2 px-6 h-10 bg-primary text-on-primary font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Transaction
            </Link>
          ) : null}
        </div>
      </div>

      {dashboardData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Net Treasury"
              value={`Rs. ${dashboardData.metrics.totalLiquidity.toLocaleString()}`}
              description="Aggregate liquidity across accounts"
              icon="account_balance_wallet"
              color="primary"
            />

            <MetricCard
              title="Est. Gross Profit"
              value={`Rs. ${dashboardData.metrics.grossProfit.toLocaleString()}`}
              description="Operational margin after COGS"
              icon="trending_up"
              color="secondary"
            />

            <MetricCard
              title="Total Revenue"
              value={`Rs. ${dashboardData.metrics.totalRevenue.toLocaleString()}`}
              description="Gross sales performance"
              icon="payments"
              color="primary"
            />

            <MetricCard
              title="Operational Costs"
              value={`Rs. ${dashboardData.metrics.totalExpenses.toLocaleString()}`}
              description="Sum of all log disbursements"
              icon="receipt_long"
              color="error"
            />
          </div>

          <DashboardShowcaseWidgets
            businessHealth={dashboardData.businessHealth}
            todaySummary={dashboardData.todaySummary}
            lowStockAlerts={dashboardData.lowStock}
            ecommerceSyncSummary={dashboardData.ecommerceSyncSummary}
            topProducts={dashboardData.topProducts}
          />

          <EcommerceIntelligence data={dashboardData.ecommerceIntelligence as any} />

          <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
            <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
              <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                Revenue Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] w-full pt-8 px-6">
              <RevenueChart data={dashboardData.chartData} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
          <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
            <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
              Workspace Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-8">
            <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
              Analytics are unavailable for this workspace right now. Core ERP modules like sales, customers, suppliers, and products are still available.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sales" className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container">
                Open Sales
              </Link>
              <Link href="/dashboard/customers" className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container">
                Open Customers
              </Link>
              <Link href="/dashboard/products" className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container">
                Open Products
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, value, description, icon, color }: { title: string; value: string; description: string; icon: string; color: "primary" | "secondary" | "error" }) {
  return (
    <Card className="p-6 hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{title}</span>
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          color === "primary" ? "bg-primary/10 text-primary" : 
          color === "secondary" ? "bg-secondary/10 text-secondary" : 
          "bg-error/10 text-error"
        )}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div>
        <div className={cn(
          "text-2xl font-black tracking-tight mb-1",
          color === "primary" ? "text-primary" : 
          color === "secondary" ? "text-secondary" : 
          "text-error"
        )}>
          {value}
        </div>
        <p className="text-[11px] text-on-surface-variant font-medium">{description}</p>
      </div>
    </Card>
  );
}

