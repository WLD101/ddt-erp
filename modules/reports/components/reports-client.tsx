// modules/reports/components/reports-client.tsx
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
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  TrendingDown, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  Calendar as CalendarIcon
} from "lucide-react";
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [m, t, tx] = await Promise.all([
        getDashboardMetrics(dateRange.from, dateRange.to),
        getFinancialTrends(30, dateRange.from, dateRange.to, interval),
        getRecentTransactions(10)
      ]);
      setMetrics(m);
      setTrends(t);
      setTransactions(tx);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-end justify-end gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="space-y-1.5 flex-1 md:flex-none">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period From</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              type="date" 
              value={dateRange.from} 
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-black/20 border-white/5 pl-9 w-full md:w-auto"
            />
          </div>
        </div>
        <div className="space-y-1.5 flex-1 md:flex-none">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Period To</label>
          <div className="relative">
             <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
             <Input 
               type="date" 
               value={dateRange.to} 
               onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
               className="bg-black/20 border-white/5 pl-9 w-full md:w-auto"
             />
          </div>
        </div>
        <div className="space-y-1.5 flex-1 md:flex-none">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Grouping</label>
          <Select value={interval} onValueChange={(val: any) => setInterval(val)}>
            <SelectTrigger className="bg-black/20 border-white/5 w-full md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Net Profit" 
          value={metrics?.grossProfit ?? 0} 
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          description="Revenue - COGS - Expenses"
        />
        <MetricCard 
          title="Total Revenue" 
          value={metrics?.totalRevenue ?? 0} 
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          description={`From ${metrics?.totalSalesCount ?? 0} sales`}
        />
        <MetricCard 
          title="COGS" 
          value={metrics?.totalCOGS ?? 0} 
          icon={<Package className="w-4 h-4 text-amber-500" />}
          description="Cost of goods sold"
        />
        <MetricCard 
          title="Expenses" 
          value={metrics?.totalExpenses ?? 0} 
          icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
          description="General operational costs"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 border-white/5 bg-background/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-xl">Financial Analysis</CardTitle>
            <CardDescription>Multi-series performance tracking</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FinancialTrendChart data={trends} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-white/5 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest 10 transactions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tx.type === "SALE" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {tx.type === "SALE" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{tx.entity}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{tx.number || "Unnumbered"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black",
                      tx.type === "SALE" ? "text-emerald-400/90" : "text-amber-400/90"
                    )}>
                      {tx.type === "SALE" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), "MMM dd")}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && !isLoading && (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Clock className="w-8 h-8 opacity-20" />
                  No transactions in this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description: string }) {
  return (
    <Card className="border-white/5 bg-gradient-to-br from-background/50 to-background/20 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold tracking-widest uppercase text-muted-foreground/70">{title}</CardTitle>
        <div className="p-2 bg-white/5 rounded-full border border-white/5">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight mb-1">
          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
