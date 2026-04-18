// app/(dashboard)/settings/audit-logs/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Info } from "lucide-react";
import { AuditLogFilters, FilterValues } from "@/modules/admin/components/audit-log-filters";
import { AuditLogTable } from "@/modules/admin/components/audit-log-table";
import { getAuditLogs } from "@/modules/admin/audit-actions";
import { toast } from "sonner";

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

    // Simple CSV export logic for the current view
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Audit <span className="text-primary">Trail</span>
            </h2>
            <div className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest flex items-center gap-1 border border-primary/20">
              <ShieldCheck className="w-3 h-3" />
              Admin Only
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mt-1">
            Track every action across your organization. This trail is immutable and serves as the single source of truth for compliance.
          </p>
        </div>
      </div>

      <AuditLogFilters onFilterChange={handleFilterChange} onExport={handleExport} />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-muted-foreground animate-pulse">Retrieving encrypted logs...</p>
          </div>
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

      <div className="mt-auto bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3 text-xs text-blue-400">
         <Info className="w-4 h-4 flex-shrink-0" />
         <p>
            Audit logs are generated automatically for all state-changing operations. 
            For security reasons, these logs cannot be manually edited or deleted by any user, including administrators.
         </p>
      </div>
    </div>
  );
}
