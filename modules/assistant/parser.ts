/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ScopedPrisma } from "@/lib/db/client";

import {
  assistantCommandSchema,
  type AssistantCommand,
  type AssistantParseResult,
} from "./types";
import {
  findCustomerCandidates,
  findInvoiceCandidates,
  findProductCandidates,
  generateDraftInvoiceNumber,
  normalizeAssistantText,
} from "./service";

function parseAmount(value: string | undefined | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function buildResult(command: AssistantCommand, response: string): AssistantParseResult {
  return {
    success: true,
    command: assistantCommandSchema.parse(command),
    response,
  };
}

function unsupportedResult(): AssistantParseResult {
  return {
    success: false,
    command: null,
    response:
      "I couldn't map that request to a safe ERP action yet. Try one of the example commands below, like creating a customer, checking stock, or listing unpaid invoices.",
  };
}

function finalizeCommand(
  base: Omit<AssistantCommand, "confidence" | "missingFields" | "message">,
  message: string,
  missingFields: string[] = [],
  confidence = 0.9
) {
  const adjustedConfidence = Math.max(
    0.25,
    Math.min(
      0.99,
      confidence - (missingFields.length > 0 ? 0.25 : 0) - totalAmbiguityPenalty(base.options)
    )
  );

  return assistantCommandSchema.parse({
    ...base,
    confidence: adjustedConfidence,
    missingFields,
    message,
  });
}

function totalAmbiguityPenalty(options: AssistantCommand["options"]) {
  let penalty = 0;
  if (options.customers.length > 1) penalty += 0.2;
  if (options.products.length > 1) penalty += 0.2;
  if (options.invoices.length > 1) penalty += 0.2;
  return penalty;
}

function currentMonthLabel() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

function resolveCandidate<T extends { score: number }>(candidates: T[]) {
  const exact = candidates.find((candidate) => candidate.score >= 0.99);
  if (exact) return exact;
  if (candidates.length === 1 && candidates[0].score >= 0.8) {
    return candidates[0];
  }
  return null;
}

export async function parseAssistantCommand(
  db: ScopedPrisma,
  branchId: string,
  rawInput: string
): Promise<AssistantParseResult> {
  const input = rawInput.trim();
  const normalized = normalizeAssistantText(input);

  if (!normalized) {
    return {
      success: false,
      command: null,
      response: "Type a request first. For example: Create customer Ahmed Electronics.",
    };
  }

  if (/^(create|add)\s+customer\s+/i.test(input)) {
    const match = input.match(/^(?:create|add)\s+customer\s+(.+)$/i);
    const name = match?.[1]?.trim() || "";
    const missingFields = name ? [] : ["name"];
    const command = finalizeCommand(
      {
        intent: "create_customer",
        entity: "customer",
        action: "create",
        operation: "create_customer",
        data: { name, status: "ACTIVE" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      name
        ? `I can create ${name} as a new customer record.`
        : "I need the customer name before I can create the record.",
      missingFields,
      0.95
    );
    return buildResult(command, command.message);
  }

  if (/^(update)\s+customer\s+/i.test(input) && /\s+to\s+/i.test(input)) {
    const match = input.match(/^update\s+customer\s+(.+?)\s+to\s+(.+)$/i);
    const customerName = match?.[1]?.trim() || "";
    const status = match?.[2]?.trim() || "";
    const customerCandidates = customerName ? await findCustomerCandidates(db, customerName) : [];
    const exactCustomer = resolveCandidate(customerCandidates);
    const missingFields = [];
    if (!customerName || !customerCandidates.length) missingFields.push("customer");
    if (!status) missingFields.push("status");
    if (!exactCustomer && customerCandidates.length > 1) missingFields.push("customer selection");

    const command = finalizeCommand(
      {
        intent: "update_customer",
        entity: "customer",
        action: "update",
        operation: "update_customer_status",
        data: {
          customerName,
          customerId: exactCustomer?.id || "",
          status,
        },
        requiresConfirmation: true,
        options: {
          customers: customerCandidates.slice(0, 5),
          products: [],
          invoices: [],
        },
      },
      exactCustomer
        ? `I can update ${exactCustomer.label} to ${status}.`
        : customerCandidates.length > 1
          ? `I found multiple customers for "${customerName}". Please choose the right one before I update the status.`
          : `I need a matching customer and target status before I can update the record.`,
      missingFields,
      exactCustomer ? 0.92 : 0.6
    );
    return buildResult(command, command.message);
  }

  if (/customer\s+.+\s+history/i.test(input)) {
    const match = input.match(/customer\s+(.+?)\s+history/i);
    const customerName = match?.[1]?.trim() || "";
    const customerCandidates = customerName ? await findCustomerCandidates(db, customerName) : [];
    const exactCustomer = resolveCandidate(customerCandidates);
    const missingFields = exactCustomer ? [] : ["customer"];
    if (!exactCustomer && customerCandidates.length > 1) {
      missingFields.push("customer selection");
    }

    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "customer",
        action: "fetch",
        operation: "query_customer_history",
        data: {
          customerId: exactCustomer?.id || "",
          customerName,
        },
        requiresConfirmation: true,
        options: {
          customers: customerCandidates.slice(0, 5),
          products: [],
          invoices: [],
        },
      },
      exactCustomer
        ? `I can load the transaction history for ${exactCustomer.label}.`
        : customerCandidates.length > 1
          ? `I found multiple customers for "${customerName}". Please choose one to see the history.`
          : "I need a customer name before I can pull the history.",
      missingFields,
      exactCustomer ? 0.9 : 0.55
    );
    return buildResult(command, command.message);
  }

  if (/^(search|find|show)\s+customer\s+/i.test(input)) {
    const match = input.match(/^(?:search|find|show)\s+customer\s+(.+)$/i);
    const customerName = match?.[1]?.trim() || "";
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "customer",
        action: "fetch",
        operation: "query_customer_search",
        data: { customerName },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      customerName
        ? `I can search for customer matches for "${customerName}".`
        : "I need a customer name or keyword to search.",
      customerName ? [] : ["customer search term"],
      0.9
    );
    return buildResult(command, command.message);
  }

  if (/^(create|add)\s+invoice\s+/i.test(input)) {
    const primaryMatch = input.match(
      /^create\s+(?:draft\s+)?invoice\s+for\s+(.+?)\s+for\s+([\d,]+(?:\.\d+)?)\s+(.+?)\s+at\s+([\d,]+(?:\.\d+)?)\s+each$/i
    );
    const fallbackMatch = input.match(
      /^create\s+(?:draft\s+)?invoice\s+for\s+(.+?)\s+for\s+([\d,]+(?:\.\d+)?)\s+(.+)$/i
    );
    const customerName = (primaryMatch?.[1] || fallbackMatch?.[1] || "").trim();
    const quantity = parseAmount(primaryMatch?.[2] || fallbackMatch?.[2]) ?? null;
    const productName = (primaryMatch?.[3] || fallbackMatch?.[3] || "").trim();
    const unitPrice = parseAmount(primaryMatch?.[4]) ?? null;

    const customerCandidates = customerName ? await findCustomerCandidates(db, customerName) : [];
    const productCandidates = productName ? await findProductCandidates(db, branchId, productName) : [];
    const exactCustomer = resolveCandidate(customerCandidates);
    const exactProduct = resolveCandidate(productCandidates);

    const missingFields: string[] = [];
    if (!customerName || !exactCustomer) missingFields.push(customerCandidates.length > 1 ? "customer selection" : "customer");
    if (!productName || !exactProduct) missingFields.push(productCandidates.length > 1 ? "product selection" : "product");
    if (!quantity) missingFields.push("quantity");
    if (unitPrice === null) missingFields.push("unit price");

    const command = finalizeCommand(
      {
        intent: "create_invoice",
        entity: "invoice",
        action: "create",
        operation: "create_draft_invoice",
        data: {
          customerId: exactCustomer?.id || "",
          customerName,
          invoiceNumber: generateDraftInvoiceNumber(),
          items: [
            {
              productId: exactProduct?.id || "",
              productName,
              quantity: quantity ?? "",
              unitPrice: unitPrice ?? "",
            },
          ],
          discount: 0,
          taxAmount: 0,
          notes: "",
          requestedStatus: "DRAFT",
        },
        requiresConfirmation: true,
        options: {
          customers: customerCandidates.slice(0, 5),
          products: productCandidates.slice(0, 5),
          invoices: [],
        },
      },
      exactCustomer && exactProduct && quantity && unitPrice !== null
        ? `I can create a draft invoice for ${exactCustomer.label} with ${quantity} × ${exactProduct.label} at ${unitPrice.toLocaleString()} each.`
        : "I can prepare a draft invoice, but I still need you to confirm the customer, product, quantity, or rate.",
      missingFields,
      exactCustomer && exactProduct && quantity && unitPrice !== null ? 0.93 : 0.58
    );
    return buildResult(command, command.message);
  }

  if (/mark\s+invoice\s+/i.test(input) && /\s+as\s+paid/i.test(input)) {
    const match = input.match(/mark\s+invoice\s+(.+?)\s+as\s+paid/i);
    const invoiceNumber = match?.[1]?.trim() || "";
    const invoiceCandidates = invoiceNumber ? await findInvoiceCandidates(db, branchId, invoiceNumber) : [];
    const exactInvoice = resolveCandidate(invoiceCandidates);
    const missingFields = exactInvoice ? [] : ["invoice"];
    if (!exactInvoice && invoiceCandidates.length > 1) {
      missingFields.push("invoice selection");
    }

    const command = finalizeCommand(
      {
        intent: "mark_invoice_paid",
        entity: "invoice",
        action: "update",
        operation: "mark_invoice_paid",
        data: {
          invoiceId: exactInvoice?.id || "",
          invoiceNumber,
        },
        requiresConfirmation: true,
        options: {
          customers: [],
          products: [],
          invoices: invoiceCandidates.slice(0, 5),
        },
      },
      exactInvoice
        ? `I can mark ${exactInvoice.label} as paid after your confirmation.`
        : invoiceCandidates.length > 1
          ? `I found multiple invoice matches for "${invoiceNumber}". Please choose one before I mark it as paid.`
          : "I need a valid invoice number before I can mark it as paid.",
      missingFields,
      exactInvoice ? 0.94 : 0.55
    );
    return buildResult(command, command.message);
  }

  if (/show\s+unpaid\s+invoices\s+this\s+month/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "invoice",
        action: "fetch",
        operation: "query_unpaid_invoices",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      `I can list unpaid invoices for ${currentMonthLabel()}.`,
      [],
      0.98
    );
    return buildResult(command, command.message);
  }

  if (/show\s+invoices\s+this\s+month/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "invoice",
        action: "fetch",
        operation: "query_invoices_this_month",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      `I can list this month's invoices for your current workspace.`,
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  if (/(show|list)\s+invoices\s+(?:for|by)\s+/i.test(input)) {
    const match = input.match(/(?:show|list)\s+invoices\s+(?:for|by)\s+(.+)$/i);
    const customerName = match?.[1]?.trim() || "";
    const customerCandidates = customerName ? await findCustomerCandidates(db, customerName) : [];
    const exactCustomer = resolveCandidate(customerCandidates);
    const missingFields = exactCustomer ? [] : ["customer"];
    if (!exactCustomer && customerCandidates.length > 1) {
      missingFields.push("customer selection");
    }
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "invoice",
        action: "fetch",
        operation: "query_invoices_by_customer",
        data: {
          customerId: exactCustomer?.id || "",
          customerName,
        },
        requiresConfirmation: true,
        options: {
          customers: customerCandidates.slice(0, 5),
          products: [],
          invoices: [],
        },
      },
      exactCustomer
        ? `I can list invoices for ${exactCustomer.label}.`
        : customerCandidates.length > 1
          ? `I found multiple customers for "${customerName}". Please choose one before I load invoices.`
          : "I need a customer name before I can load invoices.",
      missingFields,
      exactCustomer ? 0.92 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (/show\s+low\s+stock|low\s+stock/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "inventory",
        action: "fetch",
        operation: "query_low_stock",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      "I can show products that are below their low-stock threshold.",
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  if (/check\s+stock|show\s+stock|stock\s+of/i.test(normalized)) {
    const match =
      input.match(/(?:check|show)\s+stock(?:\s+of)?\s+(.+)$/i) ||
      input.match(/stock\s+of\s+(.+)$/i);
    const productName = match?.[1]?.trim() || "";
    const productCandidates = productName ? await findProductCandidates(db, branchId, productName) : [];
    const exactProduct = resolveCandidate(productCandidates);
    const missingFields = exactProduct ? [] : ["product"];
    if (!exactProduct && productCandidates.length > 1) {
      missingFields.push("product selection");
    }

    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "inventory",
        action: "fetch",
        operation: "query_stock",
        data: {
          productId: exactProduct?.id || "",
          productName,
        },
        requiresConfirmation: true,
        options: {
          customers: [],
          products: productCandidates.slice(0, 5),
          invoices: [],
        },
      },
      exactProduct
        ? `I can check the live stock level for ${exactProduct.label}.`
        : productCandidates.length > 1
          ? `I found multiple products for "${productName}". Please choose one before I check stock.`
          : "I need a product name before I can check stock.",
      missingFields,
      exactProduct ? 0.92 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (/^(add|increase)\s+[\d,]+/i.test(input) && /(inventory|stock)/i.test(input)) {
    const match =
      input.match(/^add\s+([\d,]+(?:\.\d+)?)\s+(.+?)\s+of\s+(.+?)(?:\s+to\s+(?:inventory|stock))?$/i) ||
      input.match(/^add\s+([\d,]+(?:\.\d+)?)\s+(.+?)(?:\s+to\s+(?:inventory|stock))$/i);
    const quantity = parseAmount(match?.[1]) ?? null;
    const productName = (match?.[3] || match?.[2] || "").trim();
    const productCandidates = productName ? await findProductCandidates(db, branchId, productName) : [];
    const exactProduct = resolveCandidate(productCandidates);
    const missingFields = [];
    if (!exactProduct) missingFields.push(productCandidates.length > 1 ? "product selection" : "product");
    if (quantity === null) missingFields.push("quantity");

    const command = finalizeCommand(
      {
        intent: "update_inventory",
        entity: "inventory",
        action: "update",
        operation: "add_stock",
        data: {
          productId: exactProduct?.id || "",
          productName,
          quantity: quantity ?? "",
        },
        requiresConfirmation: true,
        options: {
          customers: [],
          products: productCandidates.slice(0, 5),
          invoices: [],
        },
      },
      exactProduct && quantity !== null
        ? `I can add ${quantity} units to ${exactProduct.label}.`
        : "I can update stock, but I still need the exact product and quantity.",
      missingFields,
      exactProduct && quantity !== null ? 0.9 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (/update\s+stock|set\s+stock/i.test(normalized)) {
    const match = input.match(/(?:update|set)\s+stock(?:\s+of)?\s+(.+?)\s+to\s+([\d,]+(?:\.\d+)?)$/i);
    const productName = match?.[1]?.trim() || "";
    const quantity = parseAmount(match?.[2]) ?? null;
    const productCandidates = productName ? await findProductCandidates(db, branchId, productName) : [];
    const exactProduct = productCandidates.find((candidate) => candidate.score >= 0.99);
    const missingFields = [];
    if (!exactProduct) missingFields.push(productCandidates.length > 1 ? "product selection" : "product");
    if (quantity === null) missingFields.push("quantity");

    const command = finalizeCommand(
      {
        intent: "update_inventory",
        entity: "inventory",
        action: "update",
        operation: "set_stock",
        data: {
          productId: exactProduct?.id || "",
          productName,
          quantity: quantity ?? "",
        },
        requiresConfirmation: true,
        options: {
          customers: [],
          products: productCandidates.slice(0, 5),
          invoices: [],
        },
      },
      exactProduct && quantity !== null
        ? `I can set ${exactProduct.label} stock to ${quantity}.`
        : "I need the product and target quantity before I can set stock.",
      missingFields,
      exactProduct && quantity !== null ? 0.9 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (/^(create|add)\s+product\s+/i.test(input)) {
    const match = input.match(
      /^(?:create|add)\s+product\s+(.+?)(?:\s+at\s+([\d,]+(?:\.\d+)?))?(?:\s+cost\s+([\d,]+(?:\.\d+)?))?$/i
    );
    const name = match?.[1]?.trim() || "";
    const unitPrice = parseAmount(match?.[2]);
    const costPrice = parseAmount(match?.[3]);
    const missingFields = [];
    if (!name) missingFields.push("product name");
    if (unitPrice === null) missingFields.push("unit price");
    if (costPrice === null) missingFields.push("cost price");

    const command = finalizeCommand(
      {
        intent: "update_inventory",
        entity: "product",
        action: "create",
        operation: "create_product",
        data: {
          name,
          unitPrice: unitPrice ?? "",
          costPrice: costPrice ?? "",
          unitType: "RETAIL_QUANTITY",
          unit: "piece",
          openingQuantity: 0,
          lowStockThreshold: 10,
          sku: "",
          categoryId: "",
        },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      missingFields.length === 0
        ? `I can add ${name} to your product catalog.`
        : "I can add the product, but I still need the missing pricing details.",
      missingFields,
      missingFields.length === 0 ? 0.9 : 0.6
    );
    return buildResult(command, command.message);
  }

  if (/daily\s+sales\s+summary/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        operation: "report_daily_sales",
        data: { period: "today" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      "I can generate today's sales summary for this tenant.",
      [],
      0.98
    );
    return buildResult(command, command.message);
  }

  if (/monthly\s+sales\s+summary|generate\s+monthly\s+sales\s+report/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        operation: "report_monthly_sales",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      `I can generate the monthly sales summary for ${currentMonthLabel()}.`,
      [],
      0.98
    );
    return buildResult(command, command.message);
  }

  if (/inventory\s+report/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        operation: "report_inventory",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      "I can generate an inventory report for the active branch.",
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  if (/unpaid\s+invoice\s+report/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        operation: "report_unpaid_invoices",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      "I can generate an unpaid invoice report for this workspace.",
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  return unsupportedResult();
}
