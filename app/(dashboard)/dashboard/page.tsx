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
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  triggerNotificationPulse().catch(console.error);

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

  return (
    <div className="space-y-8 flex-1 overflow-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline-md">Business Intelligence</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Welcome back, {session?.user?.name || "Admin"}. Here's your enterprise status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 h-10 bg-surface border border-outline-variant text-on-surface font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Audit
          </button>
          <button className="flex items-center gap-2 px-6 h-10 bg-primary text-on-primary font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Net Treasury" 
          value={`Rs. ${metrics.totalLiquidity.toLocaleString()}`} 
          description="Aggregate liquidity across accounts"
          icon="account_balance_wallet"
          color="primary"
        />

        <MetricCard 
          title="Est. Gross Profit" 
          value={`Rs. ${metrics.grossProfit.toLocaleString()}`} 
          description="Operational margin after COGS"
          icon="trending_up"
          color="secondary"
        />

        <MetricCard 
          title="Total Revenue" 
          value={`Rs. ${metrics.totalRevenue.toLocaleString()}`} 
          description="Gross sales performance"
          icon="payments"
          color="primary"
        />

        <MetricCard 
          title="Operational Costs" 
          value={`Rs. ${metrics.totalExpenses.toLocaleString()}`} 
          description="Sum of all log disbursements"
          icon="receipt_long"
          color="error"
        />
      </div>

      <DashboardShowcaseWidgets
        businessHealth={businessHealth}
        todaySummary={todaySummary}
        lowStockAlerts={lowStock}
        ecommerceSyncSummary={ecommerceSyncSummary}
        topProducts={topProducts}
      />

      <EcommerceIntelligence data={ecommerceIntelligence as any} />

      <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
        <CardHeader className="border-b border-outline-variant/10 pb-4 bg-surface-container-lowest">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
            Revenue Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] w-full pt-8 px-6">
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>
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

