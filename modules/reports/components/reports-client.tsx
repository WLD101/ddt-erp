"use client";

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { loadReportsWorkspaceAction } from "../actions";
import { FinancialTrendChart } from "./financial-trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReportInterval = "day" | "week" | "month";

const defaultDateRange = () => ({
  from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  to: format(new Date(), "yyyy-MM-dd"),
});

export function ReportsClient({ canViewAdvancedTrends = true }: { canViewAdvancedTrends?: boolean }) {
  const [draftInterval, setDraftInterval] = useState<ReportInterval>("day");
  const [appliedInterval, setAppliedInterval] = useState<ReportInterval>("day");
  const [draftDateRange, setDraftDateRange] = useState(defaultDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(defaultDateRange);

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trendNotice, setTrendNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async (nextDateRange = appliedDateRange, nextInterval = appliedInterval) => {
    setIsLoading(true);
    setLoadError(null);

    const result = await loadReportsWorkspaceAction({
      fromDate: nextDateRange.from,
      toDate: nextDateRange.to,
      interval: nextInterval,
    });

    if (!result.success) {
      setMetrics(null);
      setTransactions([]);
      setTrends([]);
      setTrendNotice(null);
      setLoadError(result.message);
      setIsLoading(false);
      return;
    }

    setMetrics(result.data.metrics);
    setTransactions(result.data.transactions);
    setTrends(result.data.canViewAdvancedTrends && canViewAdvancedTrends ? result.data.trends : []);
    setTrendNotice(
      canViewAdvancedTrends
        ? result.data.trendNotice
        : "Financial trends are available on Pro and Enterprise plans."
    );
    setIsLoading(false);
  }, [appliedDateRange, appliedInterval, canViewAdvancedTrends]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = async () => {
    setAppliedDateRange(draftDateRange);
    setAppliedInterval(draftInterval);
    await loadData(draftDateRange, draftInterval);
  };

  const resetFilters = async () => {
    const nextDateRange = defaultDateRange();
    setDraftDateRange(nextDateRange);
    setAppliedDateRange(nextDateRange);
    setDraftInterval("day");
    setAppliedInterval("day");
    await loadData(nextDateRange, "day");
  };

  const hasMetricData = Boolean(metrics);
  const hasTransactions = transactions.length > 0;
  const hasTrends = trends.length > 0;
  const hasVisibleData = hasMetricData || hasTransactions || hasTrends;

  if (!metrics && isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
          Aggregating Node Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-soft md:flex-row md:items-end md:justify-end">
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="ml-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">event</span>
            Start Cycle
          </label>
          <Input
            type="date"
            value={draftDateRange.from}
            onChange={(event) =>
              setDraftDateRange((previous) => ({ ...previous, from: event.target.value }))
            }
            className="h-10 rounded-xl border-outline-variant/30 bg-surface-container-lowest"
          />
        </div>
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="ml-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">event</span>
            End Cycle
          </label>
          <Input
            type="date"
            value={draftDateRange.to}
            onChange={(event) =>
              setDraftDateRange((previous) => ({ ...previous, to: event.target.value }))
            }
            className="h-10 rounded-xl border-outline-variant/30 bg-surface-container-lowest"
          />
        </div>
        <div className="space-y-2 flex-1 md:flex-none">
          <label className="ml-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">layers</span>
            Resolution
          </label>
          <Select
            value={draftInterval}
            onValueChange={(value) => {
              if (value === "day" || value === "week" || value === "month") {
                setDraftInterval(value);
              }
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-outline-variant/30 bg-surface-container-lowest font-black text-[11px] uppercase tracking-widest md:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-outline-variant/30">
              <SelectItem value="day" className="text-[11px] font-black uppercase tracking-widest">
                Daily
              </SelectItem>
              <SelectItem value="week" className="text-[11px] font-black uppercase tracking-widest">
                Weekly
              </SelectItem>
              <SelectItem value="month" className="text-[11px] font-black uppercase tracking-widest">
                Monthly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <Button
            type="button"
            onClick={applyFilters}
            disabled={isLoading}
            className="h-10 rounded-xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary shadow-lg shadow-primary/20 hover:opacity-90"
          >
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            disabled={isLoading}
            className="h-10 rounded-xl border-outline-variant/30 bg-surface px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface"
          >
            Reset
          </Button>
        </div>
      </div>

      {loadError ? (
        <Card className="rounded-3xl border border-error/20 bg-error/5 shadow-soft">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-error">
                Reports temporarily unavailable
              </p>
              <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant">
                {loadError}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => loadData()}
              className="h-10 rounded-xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary shadow-lg shadow-primary/20 hover:opacity-90"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

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

      {!isLoading && !loadError && !hasVisibleData ? (
        <Card className="rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
          <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container-low text-on-surface-variant/40">
              <span className="material-symbols-outlined text-[30px]">query_stats</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface">
                No report data yet
              </p>
              <p className="max-w-lg text-sm font-medium leading-6 text-on-surface-variant">
                Once sales, expenses, purchases, or stock activity are recorded, your reporting workspace will populate here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-3">
        <Card className="rounded-3xl shadow-soft lg:col-span-2">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <CardTitle className="font-headline-sm text-lg font-black tracking-tight text-on-surface">
              Financial Node Analysis
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              Multi-series telemetry tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-8">
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
            ) : trends.length > 0 ? (
              <FinancialTrendChart data={trends} />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container-low text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[30px]">monitoring</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface">
                    No trend data yet
                  </p>
                  <p className="max-w-md text-sm font-medium leading-6 text-on-surface-variant">
                    Add more transactions in the selected range to unlock a richer financial trend view.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden rounded-3xl shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <div>
              <CardTitle className="font-headline-sm flex items-center gap-2 text-lg font-black tracking-tight text-on-surface">
                <span className="material-symbols-outlined text-[24px] text-primary">history</span>
                Node Activity
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Latest 10 transactions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="divide-y divide-outline-variant/10">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between p-5 transition-colors hover:bg-surface-container-low/20"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        tx.type === "SALE"
                          ? "border-secondary/20 bg-secondary/10 text-secondary"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.type === "SALE" ? "call_made" : "call_received"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight text-on-surface transition-colors group-hover:text-primary">
                        {tx.entity}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                        {tx.number || "UNNAMED"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-black tracking-tight",
                        tx.type === "SALE" ? "text-secondary" : "text-amber-600"
                      )}
                    >
                      {tx.type === "SALE" ? "+" : "-"}Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                      {format(new Date(tx.date), "MMM dd")}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && !isLoading ? (
                <div className="space-y-4 p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container-low text-on-surface-variant/20">
                    <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant italic">
                    Operational Silence
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
  color,
  bgColor,
  borderColor,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <Card className="rounded-3xl border-outline-variant/20 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
          {title}
        </CardTitle>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", bgColor, borderColor)}>
          <span className={cn("material-symbols-outlined text-[20px]", color)}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-1 text-2xl font-black tracking-tighter text-on-surface">
          Rs. {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 italic">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
