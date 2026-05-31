"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type AuditExportPreset = "today" | "last7" | "last30" | "thisMonth" | "custom";
export type AuditExportFormat = "pdf" | "xlsx" | "csv" | "json";
export type AuditExportCategory =
  | "all"
  | "login_activity"
  | "staff_actions"
  | "customer_changes"
  | "product_changes"
  | "invoice_changes"
  | "finance_changes"
  | "export_download_activity"
  | "assistant_actions";

export type AuditExportRequest = {
  preset: AuditExportPreset;
  format: AuditExportFormat;
  category: AuditExportCategory;
  reason: string;
  startDate?: string;
  endDate?: string;
};

type AuditExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: AuditExportRequest) => void;
  isExporting: boolean;
  canUseDeveloperFormats: boolean;
};

const INITIAL_STATE: AuditExportRequest = {
  preset: "last30",
  format: "pdf",
  category: "all",
  reason: "",
  startDate: "",
  endDate: "",
};

export function AuditExportDialog({
  open,
  onOpenChange,
  onConfirm,
  isExporting,
  canUseDeveloperFormats,
}: AuditExportDialogProps) {
  const [form, setForm] = useState<AuditExportRequest>(INITIAL_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_STATE);
      setErrorMessage(null);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!form.reason.trim() || form.reason.trim().length < 8) {
      setErrorMessage("Please add a short reason so your workspace can track why these audit logs are being exported.");
      return;
    }

    if (form.preset === "custom" && (!form.startDate || !form.endDate)) {
      setErrorMessage("Please choose both the start date and end date for a custom audit export.");
      return;
    }

    if (form.preset === "custom" && form.startDate && form.endDate && form.startDate > form.endDate) {
      setErrorMessage("The custom export start date must be before the end date.");
      return;
    }

    setErrorMessage(null);
    onConfirm(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] border-outline-variant/20 bg-slate-950/95 p-0 text-on-surface shadow-2xl">
        <DialogHeader className="border-b border-white/10 px-8 pt-8 pb-6">
          <DialogTitle className="text-2xl font-black tracking-tight text-white">Export Audit Logs</DialogTitle>
          <DialogDescription className="text-sm text-slate-300">
            Choose the audit window, business format, and compliance reason before downloading sensitive workspace activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-8 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audit-export-preset" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                Date range
              </Label>
              <Select
                value={form.preset}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({ ...current, preset: value as AuditExportPreset }));
                }}
              >
                <SelectTrigger id="audit-export-preset" className="border-white/10 bg-black/20 text-white">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-white">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="thisMonth">This month</SelectItem>
                  <SelectItem value="custom">Custom date range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-export-format" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                Export format
              </Label>
              <Select
                value={form.format}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({ ...current, format: value as AuditExportFormat }));
                }}
              >
                <SelectTrigger id="audit-export-format" className="border-white/10 bg-black/20 text-white">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-white">
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel / XLSX</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  {canUseDeveloperFormats ? <SelectItem value="json">JSON</SelectItem> : null}
                </SelectContent>
              </Select>
              {!canUseDeveloperFormats ? (
                <p className="text-xs text-slate-400">JSON remains limited to workspace administrators and developers.</p>
              ) : null}
            </div>
          </div>

          {form.preset === "custom" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audit-export-start" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                  Start date
                </Label>
                <Input
                  id="audit-export-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className="border-white/10 bg-black/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-export-end" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                  End date
                </Label>
                <Input
                  id="audit-export-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className="border-white/10 bg-black/20 text-white"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="audit-export-category" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Audit category
            </Label>
            <Select
              value={form.category}
              onValueChange={(value) => {
                if (!value) return;
                setForm((current) => ({ ...current, category: value as AuditExportCategory }));
              }}
            >
              <SelectTrigger id="audit-export-category" className="border-white/10 bg-black/20 text-white">
                <SelectValue placeholder="Select audit category" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-900 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="login_activity">Login activity</SelectItem>
                <SelectItem value="staff_actions">Staff actions</SelectItem>
                <SelectItem value="customer_changes">Customer changes</SelectItem>
                <SelectItem value="product_changes">Product changes</SelectItem>
                <SelectItem value="invoice_changes">Invoice changes</SelectItem>
                <SelectItem value="finance_changes">Finance changes</SelectItem>
                <SelectItem value="export_download_activity">Export / download activity</SelectItem>
                <SelectItem value="assistant_actions">Assistant actions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-export-reason" className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Reason for export
            </Label>
            <Textarea
              id="audit-export-reason"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Example: Monthly compliance review for the finance and admin leadership team."
              className="min-h-[120px] border-white/10 bg-black/20 text-white placeholder:text-slate-500"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter className="rounded-b-[28px] border-t border-white/10 bg-slate-900/90 px-8 py-5">
          <Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/5" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-primary text-on-primary hover:bg-primary/90" onClick={handleSubmit} disabled={isExporting}>
            {isExporting ? "Preparing export..." : "Download export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
