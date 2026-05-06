import { ScopedPrisma } from "@/lib/db/client";

import {
  IMPORT_FIELD_DEFINITIONS,
  IMPORT_TEMPLATES,
  IMPORT_TYPES,
  ImportType,
} from "./config";

export type ImportRow = Record<string, string>;
export type ImportMapping = Record<string, string>;

export type ImportPayload = {
  importType: ImportType;
  fileName: string;
  mapping: ImportMapping;
  rows: ImportRow[];
};

export type ImportFailure = {
  rowNumber: number;
  message: string;
  data: Record<string, string>;
};

export type ImportResult = {
  jobId: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  failures: ImportFailure[];
};

function getValue(row: ImportRow, mapping: ImportMapping, field: string) {
  const column = mapping[field];
  if (!column) {
    return "";
  }

  return String(row[column] ?? "").trim();
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function invoiceStatusFromOrderStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (["paid", "completed", "delivered"].includes(normalized)) return "PAID";
  if (["pending", "draft", "new"].includes(normalized)) return "DRAFT";
  if (["overdue", "failed", "returned", "cancelled", "canceled"].includes(normalized)) return "OVERDUE";
  return "SENT";
}

function summarizeErrors(failures: ImportFailure[]) {
  if (failures.length === 0) {
    return null;
  }

  const top = failures.slice(0, 10).map((failure) => `Row ${failure.rowNumber}: ${failure.message}`);
  return JSON.stringify({
    count: failures.length,
    top,
  });
}

async function getDefaultBranchId(db: ScopedPrisma) {
  const branch =
    (await db.branch.findFirst({
      where: { isMain: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await db.branch.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!branch) {
    throw new Error("Create a branch before importing inventory or orders.");
  }

  return branch.id;
}

async function ensureCategory(db: ScopedPrisma, name: string) {
  if (!name) return null;

  const existing = await db.category.findFirst({
    where: { name },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await db.category.create({
    data: {
      organizationId: db.organizationId,
      name,
    },
    select: { id: true },
  });

  return created.id;
}

async function ensureSupplier(db: ScopedPrisma, name: string) {
  if (!name) return null;

  const existing = await db.supplier.findFirst({
    where: { name },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await db.supplier.create({
    data: {
      organizationId: db.organizationId,
      name,
    },
    select: { id: true },
  });

  return created.id;
}

async function ensureCustomer(
  db: ScopedPrisma,
  input: { name: string; email?: string; phone?: string; address?: string }
) {
  const email = input.email?.trim();
  const phone = input.phone?.trim();
  const name = input.name.trim();

  const existing =
    (email
      ? await db.customer.findFirst({
          where: { email },
        })
      : null) ||
    (phone
      ? await db.customer.findFirst({
          where: { phone },
        })
      : null) ||
    (await db.customer.findFirst({
      where: { name },
    }));

  if (existing) {
    return db.customer.update({
      where: { id: existing.id },
      data: {
        email: email || existing.email,
        phone: phone || existing.phone,
        address: input.address?.trim() || existing.address,
      },
    });
  }

  return db.customer.create({
    data: {
      organizationId: db.organizationId,
      name,
      email: email || null,
      phone: phone || null,
      address: input.address?.trim() || null,
    },
  });
}

async function importProducts(db: ScopedPrisma, payload: ImportPayload) {
  const failures: ImportFailure[] = [];
  let successRows = 0;
  const branchId = await getDefaultBranchId(db);

  for (let index = 0; index < payload.rows.length; index += 1) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const name = getValue(row, payload.mapping, "productName");
    const sku = getValue(row, payload.mapping, "sku");
    const category = getValue(row, payload.mapping, "category");
    const costPrice = toNumber(getValue(row, payload.mapping, "costPrice"));
    const sellingPrice = toNumber(getValue(row, payload.mapping, "sellingPrice"));
    const stockQuantity = Math.max(0, Math.round(toNumber(getValue(row, payload.mapping, "stockQuantity"))));
    const supplier = getValue(row, payload.mapping, "supplier");
    const lowStockThreshold = 10;

    if (!name) {
      failures.push({ rowNumber, message: "Missing product name.", data: row });
      continue;
    }

    try {
      const categoryId = await ensureCategory(db, category);
      await ensureSupplier(db, supplier);

      const existing = sku
        ? await db.product.findFirst({
            where: { sku },
          })
        : null;

      const product = existing
        ? await db.product.update({
            where: { id: existing.id },
            data: {
              name,
              sku: sku || null,
              categoryId,
              costPrice,
              unitPrice: sellingPrice,
              lowStockThreshold,
            },
          })
        : await db.product.create({
            data: {
              organizationId: db.organizationId,
              name,
              sku: sku || null,
              categoryId,
              costPrice,
              unitPrice: sellingPrice,
              lowStockThreshold,
            },
          });

      await db.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: product.id,
          },
        },
        create: {
          organizationId: db.organizationId,
          branchId,
          productId: product.id,
          quantity: stockQuantity,
          location: "CSV Import",
        },
        update: {
          quantity: stockQuantity,
        },
      });

      successRows += 1;
    } catch (error) {
      failures.push({
        rowNumber,
        message: error instanceof Error ? error.message : "Product import failed.",
        data: row,
      });
    }
  }

  return { successRows, failures };
}

async function importCustomers(db: ScopedPrisma, payload: ImportPayload) {
  const failures: ImportFailure[] = [];
  let successRows = 0;

  for (let index = 0; index < payload.rows.length; index += 1) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const name = getValue(row, payload.mapping, "customerName");
    const email = getValue(row, payload.mapping, "email");
    const phone = getValue(row, payload.mapping, "phone");
    const address = getValue(row, payload.mapping, "address");

    if (!name) {
      failures.push({ rowNumber, message: "Missing customer name.", data: row });
      continue;
    }

    try {
      await ensureCustomer(db, { name, email, phone, address });
      successRows += 1;
    } catch (error) {
      failures.push({
        rowNumber,
        message: error instanceof Error ? error.message : "Customer import failed.",
        data: row,
      });
    }
  }

  return { successRows, failures };
}

async function importSuppliers(db: ScopedPrisma, payload: ImportPayload) {
  const failures: ImportFailure[] = [];
  let successRows = 0;

  for (let index = 0; index < payload.rows.length; index += 1) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const name = getValue(row, payload.mapping, "supplierName");
    const email = getValue(row, payload.mapping, "email");
    const phone = getValue(row, payload.mapping, "phone");
    const address = getValue(row, payload.mapping, "address");

    if (!name) {
      failures.push({ rowNumber, message: "Missing supplier name.", data: row });
      continue;
    }

    try {
      const existing =
        (email
          ? await db.supplier.findFirst({ where: { email } })
          : null) ||
        (phone
          ? await db.supplier.findFirst({ where: { phone } })
          : null) ||
        (await db.supplier.findFirst({ where: { name } }));

      if (existing) {
        await db.supplier.update({
          where: { id: existing.id },
          data: {
            email: email || existing.email,
            phone: phone || existing.phone,
            address: address || existing.address,
          },
        });
      } else {
        await db.supplier.create({
          data: {
            organizationId: db.organizationId,
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
          },
        });
      }

      successRows += 1;
    } catch (error) {
      failures.push({
        rowNumber,
        message: error instanceof Error ? error.message : "Supplier import failed.",
        data: row,
      });
    }
  }

  return { successRows, failures };
}

async function importInventory(db: ScopedPrisma, payload: ImportPayload) {
  const failures: ImportFailure[] = [];
  let successRows = 0;
  const branchId = await getDefaultBranchId(db);

  for (let index = 0; index < payload.rows.length; index += 1) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const sku = getValue(row, payload.mapping, "productSku");
    const quantity = Math.max(0, Math.round(toNumber(getValue(row, payload.mapping, "stockQuantity"))));
    const location = getValue(row, payload.mapping, "location");

    if (!sku) {
      failures.push({ rowNumber, message: "Missing product SKU.", data: row });
      continue;
    }

    try {
      const product = await db.product.findFirst({
        where: { sku },
        select: { id: true, name: true },
      });

      if (!product) {
        failures.push({ rowNumber, message: `Product with SKU ${sku} not found.`, data: row });
        continue;
      }

      await db.inventoryItem.upsert({
        where: {
          organizationId_branchId_productId: {
            organizationId: db.organizationId,
            branchId,
            productId: product.id,
          },
        },
        create: {
          organizationId: db.organizationId,
          branchId,
          productId: product.id,
          quantity,
          location: location || "CSV Import",
        },
        update: {
          quantity,
          location: location || undefined,
        },
      });

      successRows += 1;
    } catch (error) {
      failures.push({
        rowNumber,
        message: error instanceof Error ? error.message : "Inventory import failed.",
        data: row,
      });
    }
  }

  return { successRows, failures };
}

async function importOrders(db: ScopedPrisma, payload: ImportPayload) {
  const failures: ImportFailure[] = [];
  let successRows = 0;
  const branchId = await getDefaultBranchId(db);

  const grouped = new Map<string, Array<{ row: ImportRow; rowNumber: number }>>();

  payload.rows.forEach((row, index) => {
    const orderNumber = getValue(row, payload.mapping, "orderNumber");
    const rowNumber = index + 2;
    if (!orderNumber) {
      failures.push({ rowNumber, message: "Missing order number.", data: row });
      return;
    }

    const existing = grouped.get(orderNumber) ?? [];
    existing.push({ row, rowNumber });
    grouped.set(orderNumber, existing);
  });

  for (const [orderNumber, entries] of grouped.entries()) {
    try {
      const existingInvoice = await db.salesInvoice.findFirst({
        where: { invoiceNumber: orderNumber },
        select: { id: true },
      });

      if (existingInvoice) {
        entries.forEach(({ row, rowNumber }) =>
          failures.push({
            rowNumber,
            message: `Order ${orderNumber} already imported.`,
            data: row,
          })
        );
        continue;
      }

      const first = entries[0];
      const customerName = getValue(first.row, payload.mapping, "customerName");
      if (!customerName) {
        entries.forEach(({ row, rowNumber }) =>
          failures.push({
            rowNumber,
            message: `Order ${orderNumber} is missing customer name.`,
            data: row,
          })
        );
        continue;
      }

      const customer = await ensureCustomer(db, {
        name: customerName,
        email: getValue(first.row, payload.mapping, "email"),
        phone: getValue(first.row, payload.mapping, "phone"),
      });

      const items: Array<{ productId: string; quantity: number; unitPrice: number; total: number }> = [];
      let subtotal = 0;

      for (const { row, rowNumber } of entries) {
        const sku = getValue(row, payload.mapping, "productSku");
        const quantity = Math.max(1, Math.round(toNumber(getValue(row, payload.mapping, "quantity"), 1)));
        const price = toNumber(getValue(row, payload.mapping, "price"));

        const product = await db.product.findFirst({
          where: { sku },
          select: { id: true, name: true },
        });

        if (!product) {
          failures.push({
            rowNumber,
            message: `Product with SKU ${sku || "(blank)"} not found for order ${orderNumber}.`,
            data: row,
          });
          continue;
        }

        const total = quantity * price;
        subtotal += total;
        items.push({
          productId: product.id,
          quantity,
          unitPrice: price,
          total,
        });
      }

      if (items.length === 0) {
        continue;
      }

      const discount = toNumber(getValue(first.row, payload.mapping, "discount"));
      const shipping = toNumber(getValue(first.row, payload.mapping, "shipping"));
      const totalAmount = Math.max(0, subtotal - discount + shipping);
      const paymentMethod = getValue(first.row, payload.mapping, "paymentMethod");
      const orderStatus = getValue(first.row, payload.mapping, "orderStatus");
      const orderDate = getValue(first.row, payload.mapping, "orderDate");

      await db.salesInvoice.create({
        data: {
          organizationId: db.organizationId,
          branchId,
          customerId: customer.id,
          invoiceNumber: orderNumber,
          status: invoiceStatusFromOrderStatus(orderStatus),
          date: orderDate ? toDate(orderDate) : new Date(),
          subtotal,
          discount,
          taxAmount: 0,
          totalAmount,
          notes: paymentMethod ? `Imported from CSV. Payment Method: ${paymentMethod}` : "Imported from CSV.",
          items: {
            create: items,
          },
        },
      });

      successRows += entries.length;
    } catch (error) {
      entries.forEach(({ row, rowNumber }) =>
        failures.push({
          rowNumber,
          message: error instanceof Error ? error.message : `Order ${orderNumber} import failed.`,
          data: row,
        })
      );
    }
  }

  return { successRows, failures };
}

export async function createImportJob(
  db: ScopedPrisma,
  payload: ImportPayload,
  createdById: string
) {
  return db.importJob.create({
    data: {
      organizationId: db.organizationId,
      fileName: payload.fileName,
      importType: payload.importType,
      status: "PROCESSING",
      totalRows: payload.rows.length,
      createdById,
    },
  });
}

export async function runImport(
  db: ScopedPrisma,
  payload: ImportPayload,
  createdById: string
): Promise<ImportResult> {
  const job = await createImportJob(db, payload, createdById);

  let result: { successRows: number; failures: ImportFailure[] };

  switch (payload.importType) {
    case "PRODUCTS":
      result = await importProducts(db, payload);
      break;
    case "CUSTOMERS":
      result = await importCustomers(db, payload);
      break;
    case "SUPPLIERS":
      result = await importSuppliers(db, payload);
      break;
    case "ORDERS":
      result = await importOrders(db, payload);
      break;
    case "INVENTORY":
      result = await importInventory(db, payload);
      break;
    default:
      throw new Error(`Unsupported import type: ${payload.importType}`);
  }

  const failedRows = result.failures.length;
  const status =
    failedRows === 0
      ? "COMPLETED"
      : result.successRows === 0
        ? "FAILED"
        : "PARTIAL";

  const updated = await db.importJob.update({
    where: { id: job.id },
    data: {
      status,
      successRows: result.successRows,
      failedRows,
      errorSummary: summarizeErrors(result.failures),
    },
  });

  return {
    jobId: updated.id,
    status,
    totalRows: payload.rows.length,
    successRows: result.successRows,
    failedRows,
    failures: result.failures,
  };
}

export async function getRecentImportJobs(db: ScopedPrisma) {
  return db.importJob.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}

export function getImportTemplates() {
  return IMPORT_TEMPLATES;
}

export function getImportFieldDefinitions() {
  return IMPORT_FIELD_DEFINITIONS;
}

export function isImportType(value: string): value is ImportType {
  return (IMPORT_TYPES as readonly string[]).includes(value);
}
