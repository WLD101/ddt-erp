// modules/admin/components/audit-log-filters.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, RotateCcw, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuditLogMetadata } from "../audit-actions";

export interface FilterValues {
  search: string;
  userId: string;
  entityType: string;
  action: string;
}

interface AuditLogFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function AuditLogFilters({ onFilterChange, onExport, isExporting = false }: AuditLogFiltersProps) {
  const [metadata, setMetadata] = useState<{
    users: { id: string; name: string }[];
    entityTypes: string[];
    actions: string[];
  }>({ users: [], entityTypes: [], actions: [] });
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    userId: "all",
    entityType: "all",
    action: "all",
  });

  useEffect(() => {
    getAuditLogMetadata()
      .then((result) => {
        if (!result.ok) {
          setMetadata({ users: [], entityTypes: [], actions: [] });
          setMetadataMessage(result.message || "We couldn’t load audit log filters right now.");
          return;
        }

        setMetadata({
          users: result.users,
          entityTypes: result.entityTypes,
          actions: result.actions,
        });
        setMetadataMessage(null);
      })
      .catch(() => {
        setMetadata({ users: [], entityTypes: [], actions: [] });
        setMetadataMessage("We couldn’t load audit log filters right now.");
      });
  }, []);

  const handleFilterUpdate = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Normalize "all" back to empty for the API
    const normalizedFilters = { ...newFilters };
    if (normalizedFilters.userId === "all") normalizedFilters.userId = "";
    if (normalizedFilters.entityType === "all") normalizedFilters.entityType = "";
    if (normalizedFilters.action === "all") normalizedFilters.action = "";
    
    onFilterChange(normalizedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      userId: "all",
      entityType: "all",
      action: "all",
    };
    setFilters(resetFilters);
    onFilterChange({
      search: "",
      userId: "",
      entityType: "",
      action: "",
    });
  };

  return (
    <div className="space-y-4 p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
      {metadataMessage ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
          {metadataMessage}
        </div>
      ) : null}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by details or action..."
            value={filters.search}
            onChange={(e) => handleFilterUpdate("search", e.target.value)}
            className="pl-10 bg-black/20 border-white/10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onExport} variant="outline" className="border-white/10 hover:bg-white/5" disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button onClick={handleReset} variant="ghost" size="icon" className="hover:bg-white/5">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          value={filters.userId}
          onValueChange={(val) => handleFilterUpdate("userId", val)}
        >
          <SelectTrigger className="bg-black/20 border-white/10">
            <SelectValue placeholder="All Actors" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">All Actors</SelectItem>
            {metadata.users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.entityType}
          onValueChange={(val) => handleFilterUpdate("entityType", val)}
        >
          <SelectTrigger className="bg-black/20 border-white/10">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">All Modules</SelectItem>
            {metadata.entityTypes.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.action}
          onValueChange={(val) => handleFilterUpdate("action", val)}
        >
          <SelectTrigger className="bg-black/20 border-white/10">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">All Actions</SelectItem>
            {metadata.actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
