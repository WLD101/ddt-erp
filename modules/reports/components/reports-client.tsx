"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  getDashboardMetrics, 
  getFinancialTrends, 
  getRecentTransactions 
} from "../actions";
import { FinancialTrendChart } from "./financial-trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function ReportsClient() {
  const [interval, setInterval] = useState<"day" | "week" | "month">("day");
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trendNotice, setTrendNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setTrendNotice(null);
    try {
      const [m, tx, trendResult] = await Promise.all([
        getDashboardMetrics(dateRange.from, dateRange.to),
        getRecentTransactions(10),
        getFinancialTrends(30, dateRange.from, dateRange.to, interval)
          .then((data) => ({ ok: true as const, data }))
          .catch((error) => ({ ok: false as const, error })),
      ]);
      setMetrics(m);
      setTransactions(tx);
      if (trendResult.ok) {
        setTrends(trendResult.data);
      } else {
        const message =
          trendResult.error instanceof Error
            ? trendResult.error.message
            : "Financial trends are unavailable for the current plan.";
        setTrends([]);
        setTrendNotice(message);
      }
    } catch (error) {
       console.error("Failed to load analytics", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, interval]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Aggregating Node Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-end justify-end gap-6 bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-soft">
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">event</span> Start Cycle
          </label>
          <Input 
            type="date" 
            value={dateRange.from} 
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="h-10 rounded-xl bg-surface-container-lowest border-outline-variant/30"
          />
        </div>
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">event</span> End Cycle
          </label>
          <Input 
            type="date" 
            value={dateRange.to} 
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="h-10 rounded-xl bg-surface-container-lowest border-outline-variant/30"
          />
        </div>
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">layers</span> Resolution
          </label>
          <Select value={interval} onValueChange={(val: any) => setInterval(val)}>
            <SelectTrigger className="h-10 rounded-xl bg-surface-container-lowest border-outline-variant/30 w-full md:w-36 font-black text-[11px] uppercase tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-outline-variant/30">
              <SelectItem value="day" className="text-[11px] font-black uppercase tracking-widest">Daily</SelectItem>
              <SelectItem value="week" className="text-[11px] font-black uppercase tracking-widest">Weekly</SelectItem>
              <SelectItem value="month" className="text-[11px] font-black uppercase tracking-widest">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Net Profit" 
          value={metrics?.grossProfit ?? 0} 
          icon="payments"
          color="text-secondary"
          bgColor="bg-secondary/10"
          borderColor="border-secondary/20"
          description="Bottom-line liquidity"
        />
        <MetricCard 
          title="Total Revenue" 
          value={metrics?.totalRevenue ?? 0} 
          icon="trending_up"
          color="text-primary"
          bgColor="bg-primary/10"
          borderColor="border-primary/20"
          description={`${metrics?.totalSalesCount ?? 0} Nodes Processed`}
        />
        <MetricCard 
          title="COGS" 
          value={metrics?.totalCOGS ?? 0} 
          icon="inventory_2"
          color="text-amber-600"
          bgColor="bg-amber-500/10"
          borderColor="border-amber-500/20"
          description="Material acquisition cost"
        />
        <MetricCard 
          title="Expenses" 
          value={metrics?.totalExpenses ?? 0} 
          icon="trending_down"
          color="text-error"
          bgColor="bg-error/10"
          borderColor="border-error/20"
          description="Operational overhead"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 rounded-3xl shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 pb-6 bg-surface-container-lowest">
            <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Financial Node Analysis</CardTitle>
            <CardDescription className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">Multi-series telemetry tracking</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-6">
            {trendNotice ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[30px]">insights</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface">
                    Advanced analytics locked
                  </p>
                  <p className="max-w-md text-sm font-medium leading-6 text-on-surface-variant">
                    {trendNotice}
                  </p>
                </div>
              </div>
            ) : (
              <FinancialTrendChart data={trends} />
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-3xl shadow-soft overflow-hidden flex flex-col">
          <CardHeader className="border-b border-outline-variant/10 pb-6 bg-surface-container-lowest">
            <div>
              <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">history</span>
                Node Activity
              </CardTitle>
              <CardDescription className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">Latest 10 transactions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="divide-y divide-outline-variant/10">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-surface-container-low/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      tx.type === "SALE" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.type === "SALE" ? "call_made" : "call_received"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">{tx.entity}</p>
                      <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-40">{tx.number || "UNNAMED"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black tracking-tight",
                      tx.type === "SALE" ? "text-secondary" : "text-amber-600"
                    )}>
                      {tx.type === "SALE" ? "+" : "-"}Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{format(new Date(tx.date), "MMM dd")}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && !isLoading && (
                <div className="p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/20 mx-auto">
                    <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant italic">Operational Silence</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description, color, bgColor, borderColor }: { title: string; value: number; icon: string; description: string; color: string; bgColor: string; borderColor: string }) {
  return (
    <Card className="rounded-3xl shadow-soft border-outline-variant/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">{title}</CardTitle>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", bgColor, borderColor)}>
          <span className={cn("material-symbols-outlined text-[20px]", color)}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-on-surface tracking-tighter mb-1">
          Rs. {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest italic">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
