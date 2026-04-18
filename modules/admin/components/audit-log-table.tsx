// modules/admin/components/audit-log-table.tsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  ShieldAlert, 
  Terminal, 
  Calendar,
  Layers,
  Info
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface AuditLogTableProps {
  logs: any[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}

export function AuditLogTable({ 
  logs, 
  total, 
  page, 
  onPageChange, 
  totalPages 
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("blocked") || a.includes("delete") || a.includes("reject")) return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    if (a.includes("create") || a.includes("add")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (a.includes("update") || a.includes("edit")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden backdrop-blur-sm grayscale shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Timestamp</TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Actor</TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Action</TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Entity</TableHead>
              <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow className="border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => toggleRow(log.id)}>
                  <TableCell>
                    {expandedRows.has(log.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-primary/50" />
                      {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white/80">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                       </div>
                       {log.user.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tight ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                     <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary/40" />
                        <span className="text-white/60 font-medium">{log.entityType}</span>
                        <span className="text-[10px] opacity-40">({log.entityId.slice(0, 8)}...)</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {log.details || "-"}
                  </TableCell>
                </TableRow>
                
                {expandedRows.has(log.id) && (
                  <TableRow className="bg-white/[0.01] border-white/5 hover:bg-white/[0.01]">
                    <TableCell colSpan={6} className="p-4">
                      <div className="rounded-xl bg-black/40 border border-white/5 p-4 overflow-auto max-h-96 shadow-inner ring-1 ring-white/5">
                        <div className="flex items-center gap-2 mb-3 text-primary/60 font-bold text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">
                          <Terminal className="w-3 h-3" />
                          Detailed Log Data
                        </div>
                        <pre className="text-[12px] text-white/70 leading-relaxed font-mono overflow-auto">
                          {log.details}
                        </pre>
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
                           <div className="flex flex-col gap-1">
                              <span className="opacity-40">Full ID</span>
                              <span className="text-white/60 font-mono">{log.id}</span>
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="opacity-40">Entity Global ID</span>
                              <span className="text-white/60 font-mono">{log.entityId}</span>
                           </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-50">
                    <ShieldAlert className="w-12 h-12 mb-2" />
                    <p className="text-lg font-medium">No audit logs found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
        <div>
          Showing {logs.length} of {total} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="border-white/10"
          >
            Previous
          </Button>
          <div className="px-3 font-medium text-white">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="border-white/10"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
