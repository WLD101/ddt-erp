// lib/export-utils.ts
import { NextResponse } from "next/server";

/**
 * Escapes a value for CSV (RFC 4180).
 */
export function escapeCSV(value: any): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a standard CSV response for Next.js Route Handlers.
 */
export function generateCSVResponse(
  data: any[],
  columns: { header: string; key: string | ((item: any) => any) }[],
  filenamePrefix: string
) {
  const headers = columns.map(col => col.header).join(",");
  
  const rows = data.map(item => {
    return columns.map(col => {
      const val = typeof col.key === "function" ? col.key(item) : item[col.key];
      return escapeCSV(val);
    }).join(",");
  });

  // Include UTF-8 BOM for Excel compatibility
  const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}-${date}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
