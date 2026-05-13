"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuditLogFilters, type FilterValues } from "@/modules/admin/components/audit-log-filters";
import { AuditLogTable } from "@/modules/admin/components/audit-log-table";
import { getAuditLogs } from "@/modules/admin/audit-actions";

type AuditLogsClientProps = {
  featureEnabled: boolean;
};

const SAFE_LOAD_MESSAGE =
  "We couldn’t load audit logs right now. Please refresh the page or contact your workspace administrator if the issue continues.";

export function AuditLogsClient({ featureEnabled }: AuditLogsClientProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(featureEnabled);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    userId: "",
    entityType: "",
    action: "",
  });

  const fetchData = useCallback(async (currentFilters: FilterValues, currentPage: number) => {
    if (!featureEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await getAuditLogs({
        ...currentFilters,
        page: currentPage,
        pageSize: 20,
      });

      if (!result.ok) {
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
        setErrorMessage(result.message || SAFE_LOAD_MESSAGE);
        return;
      }

      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
      setErrorMessage(SAFE_LOAD_MESSAGE);
      toast.error(SAFE_LOAD_MESSAGE);
      console.error("[audit-logs] client fetch failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [featureEnabled]);

  useEffect(() => {
    void fetchData(filters, page);
  }, [filters, page, fetchData]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);

      const response = await fetch(`/api/export/audit-logs?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error || "We couldn't export audit logs right now.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(logs.length === 0 ? "Empty audit export downloaded." : "Audit export downloaded.");
    } catch (error) {
      console.error("[audit-logs] export failed", error);
      toast.error("We couldn't export audit logs right now.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
              Audit <span className="text-primary">Manifest</span>
            </h2>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Admin Protocol
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-sm font-medium text-on-surface-variant font-body-md">
            Review workspace activity history, security-sensitive changes, and compliance events without exposing technical system details to your team.
          </p>
        </div>
      </div>

      {!featureEnabled ? (
        <div className="rounded-3xl border border-primary/15 bg-primary/5 p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Feature unavailable</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-on-surface">Audit logs are not enabled on this workspace plan.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Your team can still use the ERP normally, but audit history is only available on plans that include advanced security and compliance tools.
          </p>
        </div>
      ) : (
        <>
          <AuditLogFilters onFilterChange={handleFilterChange} onExport={handleExport} isExporting={isExporting} />

          {errorMessage ? (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/8 p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">Unable to load audit logs</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                {errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                Retrieving workspace activity history...
              </p>
            </div>
          ) : (
            <AuditLogTable
              logs={logs}
              total={total}
              page={page}
              onPageChange={setPage}
              totalPages={totalPages}
            />
          )}
        </>
      )}

      <div className="mt-10 flex gap-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 text-xs font-medium text-on-surface-variant">
        <span className="material-symbols-outlined shrink-0 text-[20px] text-primary">info</span>
        <p>
          <strong className="font-black uppercase tracking-widest text-primary">Compliance note:</strong> Audit logs are generated automatically for state-changing operations and remain read-only for all workspace users.
        </p>
      </div>
    </div>
  );
}
