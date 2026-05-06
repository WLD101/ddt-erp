"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { runImportJob } from "@/modules/imports/actions";
import { IMPORT_TYPES, type ImportType } from "@/modules/imports/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ImportFieldDefinition = {
  key: string;
  label: string;
  required?: boolean;
  persisted?: boolean;
  help?: string;
};

type ImportJob = {
  id: string;
  fileName: string;
  importType: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errorSummary: string | null;
  createdAt: Date | string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type ImportFailure = {
  rowNumber: number;
  message: string;
  data: Record<string, string>;
};

type DashboardData = {
  jobs: ImportJob[];
  fields: Record<ImportType, ImportFieldDefinition[]>;
  templates: Record<ImportType, Array<Record<string, string>>>;
};

type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: Array<Record<string, string>>;
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inferMapping(importType: ImportType, headers: string[], fields: Record<ImportType, ImportFieldDefinition[]>) {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map((header) => ({
    header,
    normalized: normalizeHeader(header),
  }));

  for (const field of fields[importType]) {
    const normalizedField = normalizeHeader(field.label);
    const match = normalizedHeaders.find((header) => header.normalized.includes(normalizedField) || normalizedField.includes(header.normalized));
    if (match) {
      mapping[field.key] = match.header;
    }
  }

  return mapping;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim().length > 0));
}

async function parseUploadedFile(file: File): Promise<ParsedFile> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".xlsx")) {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const rawRows: string[][] = [];

    worksheet.eachRow((worksheetRow) => {
      const cellValues = Array.isArray(worksheetRow.values)
        ? worksheetRow.values.slice(1)
        : [];
      const values = cellValues.map((value) => String(value ?? "").trim());
      rawRows.push(values);
    });

    const [headerRow, ...dataRows] = rawRows.filter((entry) => entry.some((value) => value.length > 0));
    const headers = headerRow ?? [];
    const rows = dataRows.map((dataRow) =>
      Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""]))
    );

    return { fileName: file.name, headers, rows };
  }

  const text = await file.text();
  const rawRows = parseCsv(text);
  const [headerRow, ...dataRows] = rawRows;
  const headers = headerRow ?? [];
  const rows = dataRows.map((dataRow) =>
    Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""]))
  );

  return { fileName: file.name, headers, rows };
}

function validatePreview(importType: ImportType, rows: Array<Record<string, string>>, mapping: Record<string, string>, fields: Record<ImportType, ImportFieldDefinition[]>) {
  const requiredFields = fields[importType].filter((field) => field.required);
  const errors: Array<{ rowNumber: number; message: string }> = [];

  rows.slice(0, 20).forEach((row, index) => {
    requiredFields.forEach((field) => {
      const column = mapping[field.key];
      const value = column ? String(row[column] ?? "").trim() : "";
      if (!value) {
        errors.push({
          rowNumber: index + 2,
          message: `Missing ${field.label}.`,
        });
      }
    });
  });

  return errors;
}

function formatDate(value: Date | string) {
  const parsed = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function exportCsv(fileName: string, rows: Array<Record<string, string>>) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, "\"\"")}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportsClient({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [importType, setImportType] = useState<ImportType>("PRODUCTS");
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [lastFailures, setLastFailures] = useState<ImportFailure[]>([]);

  const headers = parsedFile?.headers ?? [];
  const rows = useMemo(() => parsedFile?.rows ?? [], [parsedFile]);
  const fieldDefinitions = initialData.fields[importType];

  const previewErrors = useMemo(
    () => validatePreview(importType, rows, mapping, initialData.fields),
    [importType, rows, mapping, initialData.fields]
  );

  const previewColumns = fieldDefinitions.filter((field) => mapping[field.key]).slice(0, 6);

  async function handleFileSelected(file: File | null) {
    if (!file) return;

    try {
      const parsed = await parseUploadedFile(file);
      setParsedFile(parsed);
      setMapping(inferMapping(importType, parsed.headers, initialData.fields));
      setLastFailures([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not parse file.");
    }
  }

  function downloadTemplate(type: ImportType) {
    exportCsv(`${type.toLowerCase()}-template.csv`, initialData.templates[type]);
  }

  function downloadErrorReport() {
    if (lastFailures.length === 0) return;

    exportCsv(
      `${importType.toLowerCase()}-import-errors.csv`,
      lastFailures.map((failure) => ({
        rowNumber: String(failure.rowNumber),
        message: failure.message,
        ...failure.data,
      }))
    );
  }

  function resetImportState(nextType: ImportType) {
    setImportType(nextType);
    setParsedFile(null);
    setMapping({});
    setLastFailures([]);
  }

  function confirmImport() {
    if (!parsedFile) {
      toast.error("Upload a CSV or XLSX file first.");
      return;
    }

    startTransition(async () => {
      const result = await runImportJob({
        importType,
        fileName: parsedFile.fileName,
        mapping,
        rows,
      });

      if (!result.success) {
        toast.error(result.error || "Import failed.");
        return;
      }

      setLastFailures(result.data.failures);
      toast.success(`Imported ${result.data.successRows} row(s) with ${result.data.failedRows} failure(s).`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-10 flex-1 overflow-auto pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Data <span className="text-primary">Recconciliation</span>
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-medium text-on-surface-variant font-body-md">
            Import products, customers, and inventory from legacy manifests or external nodes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["PRODUCTS", "CUSTOMERS", "INVENTORY"] as ImportType[]).map((type) => (
            <Button key={type} variant="outline" size="sm" onClick={() => downloadTemplate(type)} className="h-9">
              <span className="material-symbols-outlined text-[18px] mr-2">download</span>
              {type} TEMPLATE
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={importType} onValueChange={(value) => resetImportState(value as ImportType)} className="space-y-8">
        <TabsList className="bg-surface-container-low/30 p-1 rounded-2xl border border-outline-variant/30">
          {IMPORT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type} className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest">
              {type}
            </TabsTrigger>
          ))}
        </TabsList>

        {IMPORT_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="space-y-8">
            <Card className="rounded-3xl shadow-soft">
              <CardHeader className="border-b border-outline-variant/10 pb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <span className="material-symbols-outlined text-primary text-[24px]">publish</span>
                   </div>
                   <div>
                     <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">{type} Manifest Upload</CardTitle>
                     <CardDescription className="text-xs font-medium text-on-surface-variant">
                       Map columns and validate schema before finalizing the import node.
                     </CardDescription>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-3">
                    <Label htmlFor={`file-${type}`} className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Source File (CSV/XLSX)</Label>
                    <Input
                      id={`file-${type}`}
                      type="file"
                      accept=".csv,.xlsx"
                      className="h-11 rounded-xl"
                      onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button variant="ghost" disabled={isPending} onClick={() => router.refresh()} className="h-11 px-6 rounded-xl">
                    <span className="material-symbols-outlined text-[20px] mr-2">sync</span>
                    Refresh
                  </Button>
                </div>

                {parsedFile ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest">{parsedFile.fileName}</p>
                        <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">
                          Detected {rows.length} records across {headers.length} attributes.
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary">verified</span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">Attribute Mapping</h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {fieldDefinitions.map((field) => (
                          <div key={field.key} className="space-y-2 p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/20">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-on-surface uppercase tracking-wider">{field.label}</span>
                              {field.required && <Badge variant="secondary" className="text-[8px] font-black rounded-md px-1.5 py-0">REQ</Badge>}
                            </div>
                            <select
                              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              value={mapping[field.key] ?? ""}
                              onChange={(event) =>
                                setMapping((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                            >
                              <option value="">(Ignore)</option>
                              {headers.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                            {field.help && <p className="text-[9px] text-on-surface-variant/60 font-medium italic">{field.help}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">Logic Validation</h3>
                        <Badge variant={previewErrors.length === 0 ? "secondary" : "destructive"} className="font-black">
                          {previewErrors.length} ANOMALIES
                        </Badge>
                      </div>
                      
                      {previewErrors.length > 0 && (
                        <div className="rounded-2xl border border-error/20 bg-error/5 p-4">
                          <ul className="space-y-1">
                            {previewErrors.slice(0, 5).map((error, idx) => (
                              <li key={idx} className="text-[11px] font-medium text-error flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                Record {error.rowNumber}: {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm bg-surface">
                        <Table>
                          <TableHeader className="bg-surface-container-lowest">
                            <TableRow>
                              {previewColumns.map((column) => (
                                <TableHead key={column.key} className="text-[10px] font-black uppercase tracking-widest">{column.label}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.slice(0, 5).map((row, index) => (
                              <TableRow key={index}>
                                {previewColumns.map((column) => (
                                  <TableCell key={column.key} className="text-[11px] font-medium text-on-surface-variant">
                                    {mapping[column.key] ? row[mapping[column.key]] || "" : "—"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button disabled={isPending || previewErrors.length > 0} onClick={confirmImport} className="h-11 px-8 rounded-2xl">
                        {isPending ? (
                          <span className="material-symbols-outlined animate-spin text-[20px] mr-2">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px] mr-2">check_circle</span>
                        )}
                        Authorize Node Import
                      </Button>
                      {lastFailures.length > 0 && (
                        <Button variant="outline" onClick={downloadErrorReport} className="h-11 px-6 rounded-2xl">
                          <span className="material-symbols-outlined text-[20px] mr-2">bug_report</span>
                          Export Error Log
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest">
                     <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4">upload_file</span>
                     <p className="text-sm font-black text-on-surface-variant/40 uppercase tracking-widest italic">Awaiting source manifest...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="border-b border-outline-variant/10 pb-6">
          <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Node History Audit</CardTitle>
          <CardDescription className="text-xs font-medium text-on-surface-variant">
            Historical audit logs of data reconciliation jobs for the organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-surface-container-lowest">
              <TableRow>
                <TableHead className="pl-8">Execution Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Metrics</TableHead>
                <TableHead className="pr-8 text-right">Executor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.jobs.map((job) => (
                <TableRow key={job.id} className="group">
                  <TableCell className="pl-8 text-xs font-medium text-on-surface-variant">{formatDate(job.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{job.importType}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-black text-on-surface">{job.fileName}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      job.status === 'COMPLETED' ? "bg-secondary/10 text-secondary border-secondary/20" : 
                      job.status === 'FAILED' ? "bg-error/10 text-error border-error/20" : 
                      "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                    )}>
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-on-surface">{job.totalRows} Total</span>
                      <span className="text-[9px] font-bold text-secondary">{job.successRows} Success</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <p className="text-[11px] font-black text-on-surface">{job.createdBy.name || "Agent"}</p>
                    <p className="text-[9px] text-on-surface-variant/60">{job.createdBy.email}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

