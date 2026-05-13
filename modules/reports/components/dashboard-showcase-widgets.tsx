import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BusinessHealthScore = {
  score: number;
  label: string;
  tone: string;
  revenueTrendPercent: number;
  unpaidInvoicesCount: number;
  unpaidAmount: number;
  lowStockCount: number;
  expenseRatioPercent: number;
  salesActivityCount: number;
  drivers: string[];
};

type TodayBusinessSummary = {
  salesToday: number;
  purchasesToday: number;
  expensesToday: number;
  profitEstimate: number;
  ordersCount: number;
  purchaseCount: number;
  expenseCount: number;
  isEmpty: boolean;
};

type LowStockAlert = {
  id: string;
  quantity: number;
  alertLevel: string;
  branchName: string;
  product: {
    name: string;
    lowStockThreshold: number;
  };
};

type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  revenue: number;
  quantity: number;
};

type EcommerceSyncChannel = {
  type: string;
  name: string;
  isConnected: boolean;
  mode: string;
  syncStatus: string;
  lastSyncAt: Date | string | null;
  ordersSynced: number;
  productsSynced: number;
  syncError: string | null;
};

function formatCurrency(value: number) {
  return `Rs. ${(value ?? 0).toLocaleString()}`;
}

function formatSyncTime(value: Date | string | null) {
  if (!value) return "Pending";
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function healthToneClass(tone: string) {
  if (tone === "healthy") {
    return "bg-secondary/10 text-secondary border-secondary/20";
  }
  if (tone === "warning") {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
  return "bg-primary/10 text-primary border-primary/20";
}

export function DashboardShowcaseWidgets({
  businessHealth,
  todaySummary,
  lowStockAlerts,
  ecommerceSyncSummary,
  topProducts,
}: {
  businessHealth: BusinessHealthScore;
  todaySummary: TodayBusinessSummary;
  lowStockAlerts: LowStockAlert[];
  ecommerceSyncSummary: EcommerceSyncChannel[];
  topProducts: TopProduct[];
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-12">
      {/* Business Health */}
      <Card className="rounded-3xl 2xl:col-span-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">health_metrics</span>
            Enterprise Health
          </CardTitle>
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", healthToneClass(businessHealth.tone))}>
            {businessHealth.label}
          </span>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="var(--outline-variant)" strokeOpacity="0.2" strokeWidth="8"></circle>
                <circle 
                  cx="50" 
                  cy="50" 
                  fill="none" 
                  r="45" 
                  stroke={businessHealth.tone === 'healthy' ? 'var(--secondary)' : businessHealth.tone === 'warning' ? '#f59e0b' : 'var(--primary)'} 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * businessHealth.score / 100)} 
                  strokeLinecap="round" 
                  strokeWidth="8"
                  className="transition-all duration-1000"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{businessHealth.score}</span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricSmall title="Rev. Trend" value={`${businessHealth.revenueTrendPercent >= 0 ? "+" : ""}${businessHealth.revenueTrendPercent}%`} />
            <MetricSmall title="Expense load" value={`${businessHealth.expenseRatioPercent}%`} />
            <MetricSmall title="Unpaid bills" value={businessHealth.unpaidInvoicesCount.toString()} />
            <MetricSmall title="Sales volume" value={businessHealth.salesActivityCount.toString()} />
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
              <p className="text-on-surface-variant text-[11px] font-medium leading-relaxed italic">
                {businessHealth.drivers[0] || "Operational health is stable across all cost centers."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="rounded-3xl 2xl:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">event_repeat</span>
            24h Pulse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <MetricBox title="Sales" value={formatCurrency(todaySummary.salesToday)} />
            <MetricBox title="Purchases" value={formatCurrency(todaySummary.purchasesToday)} />
            <MetricBox title="Overhead" value={formatCurrency(todaySummary.expensesToday)} />
            <MetricBox 
              title="Net Impact" 
              value={formatCurrency(todaySummary.profitEstimate)} 
              valueColor={todaySummary.profitEstimate >= 0 ? "text-secondary" : "text-error"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-lg px-2.5 py-1">{todaySummary.ordersCount} deals</Badge>
            <Badge variant="outline" className="rounded-lg px-2.5 py-1 border-outline-variant">{todaySummary.purchaseCount} bills</Badge>
            <Badge variant="outline" className="rounded-lg px-2.5 py-1 border-outline-variant">{todaySummary.expenseCount} logs</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ecommerce Sync */}
      <Card className="rounded-3xl 2xl:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">sync_alt</span>
            Cloud Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ecommerceSyncSummary.map((channel) => (
            <div key={channel.type} className="p-4 border border-outline-variant/30 rounded-2xl bg-surface-container-lowest hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm",
                    channel.type === 'daraz' ? 'bg-[#FF6A00]' : 
                    channel.type === 'woocommerce' ? 'bg-[#96588A]' : 
                    channel.type === 'shopify' ? 'bg-[#95BF47]' : 'bg-primary'
                  )}>
                    {channel.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-on-surface">{channel.name}</h4>
                    <span className="text-[9px] text-on-surface-variant uppercase font-black tracking-widest">
                      {channel.isConnected ? "Operational" : "Offline"}
                    </span>
                  </div>
                </div>
                <Badge variant={channel.isConnected ? "secondary" : "outline"} className="text-[10px] rounded-lg">
                  {channel.mode}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="text-on-surface-variant font-medium">Items: <span className="font-black text-on-surface">{channel.productsSynced}</span></div>
                <div className="text-on-surface-variant font-medium">Orders: <span className="font-black text-on-surface">{channel.ordersSynced}</span></div>
                <div className="col-span-2 text-[9px] text-on-surface-variant/60 font-black uppercase tracking-widest mt-1">
                  Last: {formatSyncTime(channel.lastSyncAt)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="rounded-3xl 2xl:col-span-6 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            Replenishment Needed
          </CardTitle>
          <Link href="/dashboard/inventory" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            Audit All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                  <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Product</th>
                  <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Units</th>
                  <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {lowStockAlerts.length > 0 ? (
                  lowStockAlerts.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-on-surface">{item.product.name}</p>
                        <p className="text-[10px] font-medium text-on-surface-variant">{item.branchName}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-right text-error">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <Badge variant={item.alertLevel === "URGENT" ? "destructive" : "secondary"} className="text-[10px] font-black px-2 py-0.5 rounded-lg">
                          {item.alertLevel === "URGENT" ? "URGENT" : "LOW"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-on-surface-variant text-sm font-medium italic">
                      Inventory levels are currently optimized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card className="rounded-3xl 2xl:col-span-6 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">trending_up</span>
            Market Winners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topProducts.length > 0 ? (
            topProducts.slice(0, 5).map((product, index) => (
              <div key={product.productId} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant font-black text-lg border border-outline-variant/30 group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-on-surface truncate">{product.name}</h4>
                  <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mt-0.5">{product.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-secondary block">Rs. {(product.revenue).toLocaleString()}</span>
                  <span className="text-[10px] font-medium text-on-surface-variant">{product.quantity} units</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-on-surface-variant text-sm font-medium italic">
              Awaiting transaction data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricSmall({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-surface-container-low/30 p-3 rounded-2xl border border-outline-variant/20 flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">{title}</span>
      <span className="text-xs font-black text-on-surface">{value}</span>
    </div>
  );
}

function MetricBox({ title, value, valueColor = "text-on-surface" }: { title: string; value: string; valueColor?: string }) {
  return (
    <div className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-low/20">
      <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-lg font-black tracking-tight", valueColor)}>{value}</p>
    </div>
  );
}
