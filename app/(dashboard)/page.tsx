import { 
  getDashboardMetrics, 
  getLowStockAlerts, 
  getTopProducts, 
  getChartData 
} from "@/modules/reports/actions";
import { RevenueChart } from "@/modules/reports/components/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, LineChart, PackageSearch, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { triggerNotificationPulse } from "@/modules/notifications/actions";

export default async function DashboardPage() {
  // Sync operational health in background
  triggerNotificationPulse().catch(console.error);

  const [metrics, lowStock, topProducts, chartData] = await Promise.all([
    getDashboardMetrics(),
    getLowStockAlerts(),
    getTopProducts(),
    getChartData()
  ]);

  return (
    <div className="p-8 space-y-8 flex-1 h-full overflow-auto">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Overview
        </h2>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Your active metrics and financials for the last 30 days.
        </p>
      </div>

        <Card className="hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 border-white/5 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/80">Net Treasury</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-white">${metrics.totalLiquidity.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Sum of all bank and cash accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 border-white/5 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/80">Est. Gross Profit</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <LineChart className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-green-500">${metrics.grossProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Sales - COGS - Expenses</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 border-white/5 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/80">Total Revenue</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <LineChart className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-500">${metrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Net Sales after returns</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 border-white/5 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/80">Expenses</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-red-500">${metrics.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Operational outgoings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 h-[450px] border-white/5 shadow-md bg-gradient-to-b from-card to-card/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg">Revenue Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)] w-full pt-4">
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-6 h-full flex flex-col">
          <Card className="flex-1 overflow-hidden flex flex-col border-white/5 shadow-md relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="py-4 bg-muted/20 border-b border-white/5 z-10 flex flex-row items-center justify-between">
              <CardTitle className="text-md flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                Low Stock Alerts
              </CardTitle>
              {lowStock.length > 0 && (
                <Link href="/inventory" className="text-[10px] font-bold text-destructive hover:underline uppercase tracking-tighter flex items-center">
                  Quick Restock <ArrowRight className="w-2.5 h-2.5 ml-1" />
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4 z-10">
              {lowStock.length > 0 ? (
                <ul className="space-y-4">
                  {lowStock.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-white/5 transition-colors">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="bg-destructive/10 border border-destructive/20 text-destructive font-bold px-2 py-0.5 rounded text-xs drop-shadow-sm">
                        {item.quantity} left
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy.</p>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden flex flex-col border-white/5 shadow-md relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="py-4 bg-muted/20 border-b border-white/5 z-10">
              <CardTitle className="text-md flex items-center">
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4 z-10">
               {topProducts.length > 0 ? (
                <ul className="space-y-4 text-sm mt-2">
                  {topProducts.map(p => (
                    <li key={p.productId} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 transition-colors">
                      <span className="font-medium truncate pr-4">{p.name}</span>
                      <div className="text-right whitespace-nowrap">
                        <div className="font-bold text-primary">${p._sum.total?.toFixed(2) || "0.00"}</div>
                        <div className="text-xs text-muted-foreground">{p._sum.quantity} sold</div>
                      </div>
                    </li>
                  ))}
                </ul>
               ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">No sales data available.</p>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
