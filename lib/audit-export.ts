import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";

import { escapeCSV } from "@/lib/export-utils";
import { sanitizeFilenamePart } from "@/lib/pdf/document-utils";

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

type AuditLogRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: Date | string;
  user?: {
    name: string | null;
    email?: string | null;
  } | null;
};

type BuildAuditExportInput = {
  logs: AuditLogRecord[];
  organizationName: string;
  requestedBy: string;
  category: AuditExportCategory;
  format: AuditExportFormat;
  reason: string;
  fromDate?: string;
  toDate?: string;
};

const CATEGORY_LABELS: Record<AuditExportCategory, string> = {
  all: "All activity",
  login_activity: "Login activity",
  staff_actions: "Staff actions",
  customer_changes: "Customer changes",
  product_changes: "Product changes",
  invoice_changes: "Invoice changes",
  finance_changes: "Finance changes",
  export_download_activity: "Export and download activity",
  assistant_actions: "Assistant actions",
};

const CATEGORY_MATCHERS: Record<Exclude<AuditExportCategory, "all">, (log: AuditLogRecord) => boolean> = {
  login_activity: (log) => {
    const haystack = `${log.action} ${log.entityType} ${log.details ?? ""}`.toUpperCase();
    return ["LOGIN", "SIGNIN", "OTP", "2FA", "SESSION", "PASSWORD", "RECOVERY"].some((token) => haystack.includes(token));
  },
  staff_actions: (log) => {
    const type = log.entityType.toUpperCase();
    const action = log.action.toUpperCase();
    return ["ORGANIZATIONUSER", "ROLE", "PERMISSION", "BRANCH", "USERSECURITYPROFILE", "TRUSTEDDEVICE"].includes(type)
      || ["ASSIGN_USER_BRANCH", "CREATE_BRANCH", "DELETE_BRANCH", "REVOKE_USER_SESSIONS_ADMIN", "UPDATE_SECURITY_POLICY"].includes(action);
  },
  customer_changes: (log) => log.entityType.toUpperCase() === "CUSTOMER" || log.action.toUpperCase().includes("CUSTOMER"),
  product_changes: (log) => ["PRODUCT", "CATEGORY", "INVENTORYITEM"].includes(log.entityType.toUpperCase())
    || ["CREATE_PRODUCT", "UPDATE_PRODUCT", "DELETE_PRODUCT", "INITIAL_STOCK", "STOCK_ADJUSTMENT"].includes(log.action.toUpperCase()),
  invoice_changes: (log) => ["SALESINVOICE", "QUOTATION", "PURCHASEINVOICE"].includes(log.entityType.toUpperCase())
    || /(INVOICE|QUOTATION|PURCHASE_ORDER|RECEIPT)/i.test(log.action),
  finance_changes: (log) => ["FINANCIALACCOUNT", "LEDGERENTRY", "EXPENSE", "PAYMENT"].includes(log.entityType.toUpperCase())
    || /(PAYMENT|BALANCE|TRANSFER|EXPENSE|FINANCE)/i.test(log.action),
  export_download_activity: (log) => log.entityType.toUpperCase() === "EXPORTREQUEST"
    || /(EXPORT|DOWNLOAD)/i.test(log.action)
    || /(export|download)/i.test(log.details ?? ""),
  assistant_actions: (log) => log.entityType.toUpperCase() === "ASSISTANTCOMMAND"
    || /(ASSISTANT)/i.test(log.action)
    || /(assistant)/i.test(log.details ?? ""),
};

function formatTimestamp(value: Date | string) {
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function buildRangeLabel(fromDate?: string, toDate?: string) {
  if (!fromDate && !toDate) {
    return "All available dates";
  }
  if (fromDate && toDate) {
    return `${formatDateOnly(fromDate)} - ${formatDateOnly(toDate)}`;
  }
  if (fromDate) {
    return `From ${formatDateOnly(fromDate)}`;
  }
  return `Until ${formatDateOnly(toDate as string)}`;
}

function mapLogRow(log: AuditLogRecord) {
  return {
    timestamp: formatTimestamp(log.createdAt),
    actor: log.user?.name || log.user?.email || "Unknown user",
    actorEmail: log.user?.email || "",
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details || "",
  };
}

export function filterAuditLogsByCategory(logs: AuditLogRecord[], category: AuditExportCategory) {
  if (category === "all") return logs;
  return logs.filter(CATEGORY_MATCHERS[category]);
}

export function buildAuditExportFilename(
  organizationName: string,
  category: AuditExportCategory,
  format: AuditExportFormat,
) {
  const orgPart = sanitizeFilenamePart(organizationName, "Workspace");
  const categoryPart = sanitizeFilenamePart(CATEGORY_LABELS[category], "Audit-Logs");
  const datePart = new Date().toISOString().split("T")[0];
  return `Audit-${orgPart}-${categoryPart}-${datePart}.${format}`;
}

function buildCsv(logs: AuditLogRecord[]) {
  const headers = ["Timestamp", "Actor", "Actor Email", "Action", "Entity Type", "Entity ID", "Details"];
  const rows = logs.map((log) => {
    const row = mapLogRow(log);
    return [
      escapeCSV(row.timestamp),
      escapeCSV(row.actor),
      escapeCSV(row.actorEmail),
      escapeCSV(row.action),
      escapeCSV(row.entityType),
      escapeCSV(row.entityId),
      escapeCSV(row.details),
    ].join(",");
  });
  return `\uFEFF${[headers.join(","), ...rows].join("\n")}`;
}

async function buildWorkbook(logs: AuditLogRecord[], input: BuildAuditExportInput) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Audit Logs");
  const metaSheet = workbook.addWorksheet("Export Summary");

  worksheet.columns = [
    { header: "Timestamp", key: "timestamp", width: 24 },
    { header: "Actor", key: "actor", width: 24 },
    { header: "Actor Email", key: "actorEmail", width: 30 },
    { header: "Action", key: "action", width: 30 },
    { header: "Entity Type", key: "entityType", width: 22 },
    { header: "Entity ID", key: "entityId", width: 26 },
    { header: "Details", key: "details", width: 60 },
  ];

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };

  logs.forEach((log) => {
    worksheet.addRow(mapLogRow(log));
  });

  metaSheet.columns = [
    { header: "Field", key: "field", width: 28 },
    { header: "Value", key: "value", width: 72 },
  ];
  metaSheet.views = [{ state: "frozen", ySplit: 1 }];
  metaSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  metaSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  [
    ["Workspace", input.organizationName],
    ["Requested by", input.requestedBy],
    ["Category", CATEGORY_LABELS[input.category]],
    ["Date range", buildRangeLabel(input.fromDate, input.toDate)],
    ["Format", input.format.toUpperCase()],
    ["Reason", input.reason],
    ["Row count", logs.length.toString()],
  ].forEach(([field, value]) => metaSheet.addRow({ field, value }));

  return workbook.xlsx.writeBuffer();
}

function buildPdf(logs: AuditLogRecord[], input: BuildAuditExportInput) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 16;

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WQ", margin + 3.2, currentY + 8.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text("Audit Log Export", margin + 18, currentY + 5.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(input.organizationName, margin + 18, currentY + 10.5);

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL", pageWidth - margin, currentY + 7, { align: "right" });

  currentY += 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("CATEGORY", margin, currentY);
  doc.text("DATE RANGE", margin + 58, currentY);
  doc.text("REQUESTED BY", pageWidth - margin, currentY, { align: "right" });

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(CATEGORY_LABELS[input.category], margin, currentY);
  doc.text(buildRangeLabel(input.fromDate, input.toDate), margin + 58, currentY);
  doc.text(input.requestedBy, pageWidth - margin, currentY, { align: "right" });

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("EXPORT REASON", margin, currentY);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const reasonLines = doc.splitTextToSize(input.reason, pageWidth - margin * 2);
  doc.text(reasonLines, margin, currentY);
  currentY += reasonLines.length * 4 + 6;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Timestamp", "Actor", "Action", "Entity", "Details"]],
    body: logs.length > 0
      ? logs.map((log) => {
          const row = mapLogRow(log);
          return [
            row.timestamp,
            row.actor,
            row.action,
            `${row.entityType}${row.entityId ? ` (${row.entityId})` : ""}`,
            row.details || "-",
          ];
        })
      : [["No audit logs matched this filter", "-", "-", "-", "-"]],
    theme: "plain",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      cellPadding: 3.5,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 32 },
      3: { cellWidth: 34 },
      4: { cellWidth: "auto" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated using WhatsQuery.com", margin, pageHeight - 8);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function buildAuditExportResponse(input: BuildAuditExportInput) {
  const filteredLogs = filterAuditLogsByCategory(input.logs, input.category);
  const fileName = buildAuditExportFilename(input.organizationName, input.category, input.format);

  if (input.format === "csv") {
    return new NextResponse(buildCsv(filteredLogs), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (input.format === "json") {
    return NextResponse.json(
      {
        workspace: input.organizationName,
        requestedBy: input.requestedBy,
        category: CATEGORY_LABELS[input.category],
        dateRange: buildRangeLabel(input.fromDate, input.toDate),
        reason: input.reason,
        rowCount: filteredLogs.length,
        logs: filteredLogs.map(mapLogRow),
      },
      {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (input.format === "xlsx") {
    const workbookBuffer = await buildWorkbook(filteredLogs, input);
    return new NextResponse(Buffer.from(workbookBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(buildPdf(filteredLogs, input), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function getAuditCategoryLabel(category: AuditExportCategory) {
  return CATEGORY_LABELS[category];
}
