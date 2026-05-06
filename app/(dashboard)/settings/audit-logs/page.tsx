"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuditLogFilters, FilterValues } from "@/modules/admin/components/audit-log-filters";
import { AuditLogTable } from "@/modules/admin/components/audit-log-table";
import { getAuditLogs } from "@/modules/admin/audit-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    userId: "",
    entityType: "",
    action: "",
  });

  const fetchData = useCallback(async (currentFilters: FilterValues, currentPage: number) => {
    setIsLoading(true);
    try {
      const result = await getAuditLogs({
        ...currentFilters,
        page: currentPage,
        pageSize: 20,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters, page);
  }, [filters, page, fetchData]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on new filter
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Timestamp", "Actor", "Action", "Entity Type", "Entity ID", "Details"];
    const csvRows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.user.name,
      log.action,
      log.entityType,
      log.entityId,
      `"${(log.details || "").replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV Export started");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
              Audit <span className="text-primary">Manifest</span>
            </h2>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Admin Protocol
            </div>
          </div>
          <p className="text-on-surface-variant max-w-2xl mt-1 text-sm font-medium font-body-md">
            Track every action across your organization. This trail is immutable and serves as the single source of truth for compliance audits.
          </p>
        </div>
      </div>

      <AuditLogFilters onFilterChange={handleFilterChange} onExport={handleExport} />

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4">
           <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Retrieving encrypted logs...</p>
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

      <div className="mt-10 bg-primary/5 border border-primary/10 p-6 rounded-3xl flex gap-4 text-xs font-medium text-on-surface-variant">
         <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
         <p>
            <strong className="text-primary font-black uppercase tracking-widest">Compliance Note:</strong> Audit logs are generated automatically for all state-changing operations. 
            For security reasons, these logs cannot be manually edited or deleted by any user node, including master administrators.
         </p>
      </div>
    </div>
  );
}
