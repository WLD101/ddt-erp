/* eslint-disable @typescript-eslint/no-explicit-any */
import { startOfMonth, startOfToday, endOfMonth, endOfToday } from "date-fns";

import { type ScopedPrisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission, type TenantContext } from "@/lib/tenant";
import { createPayment } from "@/modules/payments/service";
import { createCustomer as createCustomerRecord, updateCustomer as updateCustomerRecord, getCustomerById } from "@/modules/customers/service";
import { createProduct as createProductRecord } from "@/modules/products/service";
import { adjustStock, initializeInventory } from "@/modules/inventory/service";
import { getDashboardMetrics, getTodaysBusinessSummary } from "@/modules/reports/service";
import { assertPlanLimit } from "@/lib/billing/enforcement";
import type { AssistantCommand, AssistantExecutionResult, AssistantOption } from "./types";

type CandidateScore = AssistantOption & { score: number; name?: string; meta?: Record<string, unknown> };

export function normalizeAssistantText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreLabel(query: string, label: string) {
  const normalizedQuery = normalizeAssistantText(query);
  const normalizedLabel = normalizeAssistantText(label);
  if (!normalizedQuery || !normalizedLabel) return 0;
  if (normalizedLabel === normalizedQuery) return 1;
  if (normalizedLabel.startsWith(normalizedQuery)) return 0.92;
  if (normalizedLabel.includes(normalizedQuery)) return 0.84;

  const normalizeToken = (token: string) =>
    token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;

  const queryTokens = new Set(normalizedQuery.split(" ").filter(Boolean).map(normalizeToken));
  const labelTokens = new Set(normalizedLabel.split(" ").filter(Boolean).map(normalizeToken));
  const overlap = [...queryTokens].filter((token) => labelTokens.has(token)).length;
  if (!overlap) return 0.2;
  return Math.min(0.82, overlap / Math.max(queryTokens.size, labelTokens.size));
}

function sortCandidates<T extends CandidateScore>(items: T[]) {
  return items.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function monthBounds() {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function generateDraftInvoiceNumber() {
  const stamp = Date.now().toString().slice(-6);
  return `INV-${stamp}`;
}

export async function findCustomerCandidates(db: ScopedPrisma, query: string) {
  const normalized = normalizeAssistantText(query);
  const tokens = normalized.split(" ").filter(Boolean).slice(0, 5);
  const customers = await db.customer.findMany({
    where: tokens.length
      ? ({
          OR: tokens.map((token) => ({
            name: { contains: token, mode: "insensitive" },
          })),
        } as any)
      : undefined,
    take: 12,
    orderBy: { name: "asc" },
  });

  return sortCandidates(
    customers.map((customer) => ({
      id: customer.id,
      label: customer.name,
      description: customer.status ? `Status: ${customer.status}` : undefined,
      score: scoreLabel(query, customer.name),
      meta: customer,
    }))
  );
}

export async function findProductCandidates(db: ScopedPrisma, branchId: string, query: string) {
  const normalized = normalizeAssistantText(query);
  const tokens = normalized.split(" ").filter(Boolean).slice(0, 5);
  const expandedTokens = Array.from(
    new Set(
      tokens.flatMap((token) =>
        token.length > 3 && token.endsWith("s") ? [token, token.slice(0, -1)] : [token]
      )
    )
  );
  const products = await db.product.findMany({
    where: expandedTokens.length
      ? ({
          OR: expandedTokens.flatMap((token) => [
            { name: { contains: token, mode: "insensitive" } },
            { sku: { contains: token, mode: "insensitive" } },
          ]),
        } as any)
      : undefined,
    include: {
      inventoryItems: {
        where: { branchId },
        select: { id: true, quantity: true },
      },
    },
    take: 12,
    orderBy: { name: "asc" },
  });

  return sortCandidates(
    products.map((product) => ({
      id: product.id,
      label: product.name,
      description: `${product.unit || "unit"} • ${product.inventoryItems[0]?.quantity ?? 0} available`,
      score: Math.max(scoreLabel(query, product.name), scoreLabel(query, `${product.name} ${product.sku || ""}`)),
      meta: product,
    }))
  );
}

export async function findInvoiceCandidates(db: ScopedPrisma, branchId: string, invoiceNumber: string) {
  const normalized = normalizeAssistantText(invoiceNumber);
  const invoices = await db.salesInvoice.findMany({
    where: {
      branchId,
      invoiceNumber: {
        contains: normalized || invoiceNumber,
        mode: "insensitive",
      } as any,
    },
    include: {
      customer: { select: { name: true } },
      payments: { select: { amount: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return sortCandidates(
    invoices.map((invoice) => ({
      id: invoice.id,
      label: invoice.invoiceNumber,
      description: `${invoice.customer.name} • ${invoice.status}`,
      score: scoreLabel(invoiceNumber, invoice.invoiceNumber),
      meta: invoice,
    }))
  );
}

export async function executeAssistantCommand(
  db: ScopedPrisma,
  ctx: TenantContext,
  command: AssistantCommand
): Promise<AssistantExecutionResult> {
  if (command.missingFields.length > 0) {
    return {
      success: false,
      message: `I still need these details before I can continue: ${command.missingFields.join(", ")}.`,
    };
  }

  switch (command.operation) {
    case "create_customer": {
      requirePermission(ctx, "customers.create");
      const customer = await createCustomerRecord(db, {
        name: command.data.name,
        email: command.data.email || null,
        phone: command.data.phone || null,
        address: command.data.address || null,
        status: command.data.status || "ACTIVE",
      });
      await writeAuditLog(
        ctx,
        "ASSISTANT_CREATE_CUSTOMER",
        "Customer",
        customer.id,
        `Created customer ${customer.name} from Smart Assistant`
      );
      return {
        success: true,
        message: `${customer.name} has been created successfully.`,
        result: {
          customerId: customer.id,
          customerName: customer.name,
          status: customer.status,
        },
      };
    }
    case "update_customer_status": {
      requirePermission(ctx, "customers.edit");
      const current = await getCustomerById(db, command.data.customerId);
      if (!current) {
        return { success: false, message: "I couldn't find that customer in this workspace." };
      }
      const updated = await updateCustomerRecord(db, current.id, {
        name: current.name,
        email: current.email || "",
        phone: current.phone || "",
        address: current.address || "",
        status: command.data.status,
      });
      await writeAuditLog(
        ctx,
        "ASSISTANT_UPDATE_CUSTOMER_STATUS",
        "Customer",
        updated.id,
        `Updated ${updated.name} to status ${updated.status}`
      );
      return {
        success: true,
        message: `${updated.name} is now marked as ${updated.status}.`,
        result: {
          customerId: updated.id,
          customerName: updated.name,
          status: updated.status,
        },
      };
    }
    case "create_product": {
      requirePermission(ctx, "products.create");
      await assertPlanLimit(ctx.organizationId, "maxProducts");
      const product = await createProductRecord(
        db,
        {
          name: command.data.name,
          sku: command.data.sku || "",
          categoryId: command.data.categoryId || "",
          unitPrice: Number(command.data.unitPrice || 0),
          costPrice: Number(command.data.costPrice || 0),
          lowStockThreshold: Number(command.data.lowStockThreshold || 10),
          openingQuantity: Number(command.data.openingQuantity || 0),
          unitType: command.data.unitType,
          unit: command.data.unit,
        },
        ctx.branchId
      );
      await writeAuditLog(
        ctx,
        "ASSISTANT_CREATE_PRODUCT",
        "Product",
        product.id,
        `Created product ${product.name} from Smart Assistant`
      );
      return {
        success: true,
        message: `${product.name} has been added to your catalog.`,
        result: {
          productId: product.id,
          productName: product.name,
        },
      };
    }
    case "add_stock":
    case "set_stock": {
      requirePermission(ctx, "products.edit");
      const productId = command.data.productId as string;
      const quantity = Number(command.data.quantity || 0);
      const reason =
        command.operation === "add_stock"
          ? `Assistant stock addition for ${command.data.productName || "product"}`
          : `Assistant stock set for ${command.data.productName || "product"}`;

      const currentItem = await db.inventoryItem.findFirst({
        where: { branchId: ctx.branchId, productId },
        include: { product: true },
      });

      let updatedQuantity = quantity;
      if (!currentItem) {
        if (command.operation === "set_stock") {
          await initializeInventory(db, ctx.branchId, {
            productId,
            quantity,
            location: "Main Warehouse",
          });
        } else {
          await initializeInventory(db, ctx.branchId, {
            productId,
            quantity,
            location: "Main Warehouse",
          });
        }
      } else if (command.operation === "set_stock") {
        const adjustment = quantity - currentItem.quantity;
        updatedQuantity = quantity;
        if (adjustment !== 0) {
          await adjustStock(db, ctx.branchId, {
            inventoryItemId: currentItem.id,
            adjustment,
            reason,
          });
        }
      } else {
        updatedQuantity = currentItem.quantity + quantity;
        await adjustStock(db, ctx.branchId, {
          inventoryItemId: currentItem.id,
          adjustment: quantity,
          reason,
        });
      }

      const fresh = await db.inventoryItem.findFirst({
        where: { branchId: ctx.branchId, productId },
        include: { product: true },
      });
      await writeAuditLog(
        ctx,
        "ASSISTANT_UPDATE_STOCK",
        "InventoryItem",
        fresh?.id || productId,
        `${command.operation === "set_stock" ? "Set" : "Added"} stock for ${fresh?.product.name || command.data.productName}`
      );
      return {
        success: true,
        message: `${fresh?.product.name || command.data.productName} now has ${fresh?.quantity ?? updatedQuantity} ${fresh?.product.unit || "units"} available.`,
        result: {
          productId,
          productName: fresh?.product.name || command.data.productName,
          quantity: fresh?.quantity ?? updatedQuantity,
          unit: fresh?.product.unit || command.data.unit || "units",
        },
      };
    }
    case "create_draft_invoice": {
      requirePermission(ctx, "sales.create");
      await assertPlanLimit(ctx.organizationId, "maxMonthlyInvoices");
      const items = (command.data.items as any[]).map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        return {
          productId: item.productId,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = Number(command.data.discount || 0);
      const taxAmount = Number(command.data.taxAmount || 0);
      const totalAmount = Math.max(0, subtotal - discount + taxAmount);

      const invoice = await db.salesInvoice.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: ctx.branchId,
          customerId: command.data.customerId,
          invoiceNumber: command.data.invoiceNumber || generateDraftInvoiceNumber(),
          status: "DRAFT",
          subtotal,
          discount,
          taxAmount,
          totalAmount,
          notes: command.data.notes || null,
          items: { create: items },
        },
        include: { customer: true },
      });

      await writeAuditLog(
        ctx,
        "ASSISTANT_CREATE_DRAFT_INVOICE",
        "SalesInvoice",
        invoice.id,
        `Created draft invoice ${invoice.invoiceNumber} for ${invoice.customer.name}`
      );

      return {
        success: true,
        message: `Draft invoice ${invoice.invoiceNumber} has been created for ${invoice.customer.name}.`,
        redirectUrl: `/sales/${invoice.id}`,
        result: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
        },
      };
    }
    case "mark_invoice_paid": {
      requirePermission(ctx, "payments.manage");
      const invoice = await db.salesInvoice.findFirst({
        where: { branchId: ctx.branchId, id: command.data.invoiceId },
        include: {
          customer: true,
          payments: true,
        },
      });

      if (!invoice) {
        return { success: false, message: "I couldn't find that invoice in this workspace." };
      }
      if (invoice.status === "PAID") {
        return { success: false, message: `${invoice.invoiceNumber} is already marked as paid.` };
      }

      const paidAlready = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(0, invoice.totalAmount - paidAlready);
      if (remaining <= 0) {
        return { success: false, message: `${invoice.invoiceNumber} already has full payment recorded.` };
      }

      let account = await db.financialAccount.findFirst({
        where: { isDefault: true, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!account) {
        account = await db.financialAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!account) {
        account = await db.financialAccount.create({
          data: {
            organizationId: ctx.organizationId,
            name: "Main Cash Account",
            type: "CASH",
            currentBalance: 0,
            isDefault: true,
            isActive: true,
          },
        });
      }

      const payment = await createPayment(db, ctx.branchId, {
        type: "IN",
        amount: remaining,
        paymentMethod: "SMART_ASSISTANT",
        accountId: account.id,
        referenceNumber: `ASSISTANT-${invoice.invoiceNumber}`,
        date: new Date(),
        customerId: invoice.customerId,
        salesInvoiceId: invoice.id,
      });

      await writeAuditLog(
        ctx,
        "ASSISTANT_MARK_INVOICE_PAID",
        "SalesInvoice",
        invoice.id,
        `Recorded payment ${payment.id} for ${invoice.invoiceNumber}`
      );

      return {
        success: true,
        message: `${invoice.invoiceNumber} has been marked as paid.`,
        redirectUrl: `/sales/${invoice.id}`,
        result: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          paymentId: payment.id,
          amount: remaining,
        },
      };
    }
    case "query_customer_history": {
      requirePermission(ctx, "customers.view");
      const customer = await getCustomerById(db, command.data.customerId);
      if (!customer) {
        return { success: false, message: "I couldn't find that customer in this workspace." };
      }
      const outstanding = customer.salesInvoices
        .filter((invoice) => invoice.status !== "PAID")
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      return {
        success: true,
        message: `Loaded history for ${customer.name}.`,
        result: {
          customerId: customer.id,
          customerName: customer.name,
          invoices: customer.salesInvoices.length,
          payments: customer.payments.length,
          outstanding,
        },
      };
    }
    case "query_customer_search": {
      requirePermission(ctx, "customers.view");
      const candidates = await findCustomerCandidates(db, command.data.customerName || "");
      return {
        success: true,
        message: candidates.length
          ? `I found ${candidates.length} customer match${candidates.length === 1 ? "" : "es"}.`
          : "I couldn't find any matching customers.",
        result: {
          customers: candidates.map(({ id, label, description }) => ({ id, label, description })),
        },
      };
    }
    case "query_stock":
    case "query_low_stock":
    case "query_unpaid_invoices":
    case "query_invoices_by_customer":
    case "query_invoices_this_month":
    case "report_daily_sales":
    case "report_monthly_sales":
    case "report_inventory":
    case "report_unpaid_invoices": {
      return executeAssistantQuery(db, ctx, command);
    }
    default:
      return {
        success: false,
        message: "This assistant action is not ready yet. Please use the standard ERP page for now.",
      };
  }
}

async function executeAssistantQuery(
  db: ScopedPrisma,
  ctx: TenantContext,
  command: AssistantCommand
): Promise<AssistantExecutionResult> {
  switch (command.operation) {
    case "query_stock": {
      requirePermission(ctx, "products.view");
      const item = await db.inventoryItem.findFirst({
        where: { branchId: ctx.branchId, productId: command.data.productId },
        include: { product: true },
      });
      return {
        success: true,
        message: item
          ? `${item.product.name} currently has ${item.quantity} ${item.product.unit || "units"} in stock.`
          : `No inventory record exists yet for ${command.data.productName}.`,
        result: item
          ? {
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              unit: item.product.unit || "units",
            }
          : {
              productId: command.data.productId,
              productName: command.data.productName,
              quantity: 0,
            },
      };
    }
    case "query_low_stock": {
      requirePermission(ctx, "products.view");
      const items = await db.inventoryItem.findMany({
        where: { branchId: ctx.branchId },
        include: { product: true },
        orderBy: { quantity: "asc" },
      });
      const lowStock = items
        .filter((item) => item.quantity <= item.product.lowStockThreshold)
        .slice(0, 25)
        .map((item) => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          threshold: item.product.lowStockThreshold,
          unit: item.product.unit || "units",
        }));

      return {
        success: true,
        message: lowStock.length
          ? `I found ${lowStock.length} low-stock product${lowStock.length === 1 ? "" : "s"}.`
          : "No products are below their low-stock threshold right now.",
        result: { lowStock },
      };
    }
    case "query_unpaid_invoices":
    case "query_invoices_this_month": {
      requirePermission(ctx, "sales.view");
      const { start, end } = monthBounds();
      const invoices = await db.salesInvoice.findMany({
        where: {
          branchId: ctx.branchId,
          ...(command.operation === "query_unpaid_invoices"
            ? { status: { not: "PAID" } }
            : {}),
          issueDate: { gte: start, lte: end },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { issueDate: "desc" },
        take: 25,
      });
      return {
        success: true,
        message: invoices.length
          ? `I found ${invoices.length} invoice${invoices.length === 1 ? "" : "s"} for this month.`
          : "There are no matching invoices for this month.",
        result: {
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.name,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
            date: invoice.issueDate.toISOString(),
          })),
        },
      };
    }
    case "query_invoices_by_customer": {
      requirePermission(ctx, "sales.view");
      const invoices = await db.salesInvoice.findMany({
        where: {
          branchId: ctx.branchId,
          customerId: command.data.customerId,
        },
        include: { customer: { select: { name: true } } },
        orderBy: { issueDate: "desc" },
        take: 25,
      });
      return {
        success: true,
        message: invoices.length
          ? `I found ${invoices.length} invoice${invoices.length === 1 ? "" : "s"} for ${command.data.customerName}.`
          : `I couldn't find invoices for ${command.data.customerName}.`,
        result: {
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.name,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
            date: invoice.issueDate.toISOString(),
          })),
        },
      };
    }
    case "report_daily_sales": {
      requirePermission(ctx, "reports.view");
      const summary = await getTodaysBusinessSummary(db, ctx.branchId);
      return {
        success: true,
        message: summary.isEmpty ? "No sales activity has been recorded today yet." : "Today's sales summary is ready.",
        result: summary as Record<string, any>,
      };
    }
    case "report_monthly_sales": {
      requirePermission(ctx, "reports.view");
      const { start, end } = monthBounds();
      const summary = await getDashboardMetrics(
        db,
        ctx.branchId,
        start.toISOString(),
        end.toISOString()
      );
      return {
        success: true,
        message: "Monthly sales summary is ready.",
        result: summary as Record<string, any>,
      };
    }
    case "report_inventory": {
      requirePermission(ctx, "products.view");
      const items = await db.inventoryItem.findMany({
        where: { branchId: ctx.branchId },
        include: { product: true },
        orderBy: { product: { name: "asc" } },
        take: 50,
      });
      return {
        success: true,
        message: items.length ? "Inventory report is ready." : "No inventory items exist yet for this branch.",
        result: {
          items: items.map((item) => ({
            id: item.id,
            productName: item.product.name,
            quantity: item.quantity,
            unit: item.product.unit || "units",
            lowStockThreshold: item.product.lowStockThreshold,
          })),
        },
      };
    }
    case "report_unpaid_invoices": {
      requirePermission(ctx, "reports.view");
      const invoices = await db.salesInvoice.findMany({
        where: {
          branchId: ctx.branchId,
          status: { not: "PAID" },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { issueDate: "desc" },
        take: 50,
      });
      return {
        success: true,
        message: invoices.length ? "Unpaid invoice report is ready." : "There are no unpaid invoices right now.",
        result: {
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.name,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
            date: invoice.issueDate.toISOString(),
          })),
        },
      };
    }
    default:
      return {
        success: false,
        message: "I couldn't run that assistant query yet.",
      };
  }
}
