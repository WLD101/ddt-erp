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

type AssistantLanguage = AssistantCommand["language"];

function parseAmount(value: string | undefined | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function detectAssistantLanguage(input: string): AssistantLanguage {
  if (/[\u0600-\u06FF]/u.test(input)) {
    return "ur";
  }

  if (
    /\b(naya|banao|bana do|karo|dikhao|naam|hisab|balance|customer|invoice|stock|report)\b/i.test(
      input
    )
  ) {
    return "roman-ur";
  }

  return "en";
}

function translate(
  language: AssistantLanguage,
  copy: { en: string; ur?: string; romanUr?: string }
) {
  if (language === "ur") return copy.ur ?? copy.romanUr ?? copy.en;
  if (language === "roman-ur") return copy.romanUr ?? copy.en;
  return copy.en;
}

function buildResult(command: AssistantCommand, response: string): AssistantParseResult {
  return {
    success: true,
    command: assistantCommandSchema.parse(command),
    response,
  };
}

function unsupportedResult(language: AssistantLanguage): AssistantParseResult {
  return {
    success: false,
    command: null,
    response: translate(language, {
      en: "I couldn't map that request to a safe ERP action yet. Try creating a customer, checking stock, or listing unpaid invoices.",
      romanUr:
        "Main is request ko abhi safe ERP action mein map nahi kar saka. Customer banao, stock check karo, ya unpaid invoices dikhao.",
      ur: "میں ابھی اس درخواست کو محفوظ ERP ایکشن میں تبدیل نہیں کر سکا۔ کسٹمر بنائیں، اسٹاک چیک کریں، یا غیر ادا شدہ انوائسز دکھائیں۔",
    }),
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

function matchesCreateCustomerIntent(input: string, normalized: string) {
  return (
    /^(create|add|new|register)\s+customer\b/i.test(input) ||
    /^(?:add\s+new\s+customer)\b/i.test(input) ||
    /\bcustomer\s+bana\s+do\b/i.test(normalized) ||
    /\bnaya\s+customer\b/i.test(normalized) ||
    /کسٹمر/u.test(input)
  );
}

function extractCreateCustomerName(input: string) {
  const patterns = [
    /^(?:create|add|new|register)\s+customer\s+(.+)$/i,
    /^(?:add\s+new\s+customer)\s+(.+)$/i,
    /^(?:naya\s+customer\s+(?:add\s+karo|bana\s+do))\s+(.+)$/i,
    /^customer\s+bana\s+do\s+(.+)$/i,
    /^(.+?)\s+ka\s+customer\s+bana\s+do$/i,
    /^نیا\s+کسٹمر\s+بن(?:ائیں|او)\s+(.+)$/u,
    /^کسٹمر\s+بنا\s+دو\s+(.+)$/u,
    /^(.+?)\s+کا\s+کسٹمر\s+بنا\s+دو$/u,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return "";
}

function matchesCreateInvoiceIntent(input: string, normalized: string) {
  return (
    /^(create|add)\s+(?:draft\s+)?invoice\b/i.test(input) ||
    /\binvoice\s+banao\b/i.test(normalized) ||
    /\binvoice\s+banado\b/i.test(normalized) ||
    /انوائس/u.test(input)
  );
}

function extractInvoiceIntentParts(input: string) {
  const primaryMatch = input.match(
    /^create\s+(?:draft\s+)?invoice\s+for\s+(.+?)\s+for\s+([\d,]+(?:\.\d+)?)\s+(.+?)\s+at\s+([\d,]+(?:\.\d+)?)\s+each$/i
  );
  if (primaryMatch) {
    return {
      customerName: primaryMatch[1]?.trim() || "",
      quantity: parseAmount(primaryMatch[2]),
      productName: primaryMatch[3]?.trim() || "",
      unitPrice: parseAmount(primaryMatch[4]),
    };
  }

  const fallbackMatch = input.match(
    /^create\s+(?:draft\s+)?invoice\s+for\s+(.+?)\s+for\s+([\d,]+(?:\.\d+)?)\s+(.+)$/i
  );
  if (fallbackMatch) {
    return {
      customerName: fallbackMatch[1]?.trim() || "",
      quantity: parseAmount(fallbackMatch[2]),
      productName: fallbackMatch[3]?.trim() || "",
      unitPrice: null,
    };
  }

  const romanUrduMatch = input.match(
    /^(.+?)\s+ke\s+naam\s+invoice\s+banao(?:\s+for\s+([\d,]+(?:\.\d+)?)\s+(.+?)(?:\s+at\s+([\d,]+(?:\.\d+)?)\s+each)?)?$/i
  );
  if (romanUrduMatch) {
    return {
      customerName: romanUrduMatch[1]?.trim() || "",
      quantity: parseAmount(romanUrduMatch[2]),
      productName: romanUrduMatch[3]?.trim() || "",
      unitPrice: parseAmount(romanUrduMatch[4]),
    };
  }

  const urduMatch = input.match(/^(.+?)\s+کے\s+نام\s+انوائس\s+بن(?:ائیں|اؤ)(?:\s+(.+))?$/u);
  if (urduMatch) {
    return {
      customerName: urduMatch[1]?.trim() || "",
      quantity: null,
      productName: urduMatch[2]?.trim() || "",
      unitPrice: null,
    };
  }

  return {
    customerName: "",
    quantity: null,
    productName: "",
    unitPrice: null,
  };
}

export async function parseAssistantCommand(
  db: ScopedPrisma,
  branchId: string,
  rawInput: string
): Promise<AssistantParseResult> {
  const input = rawInput.trim();
  const normalized = normalizeAssistantText(input);
  const language = detectAssistantLanguage(input);

  if (!normalized) {
    return {
      success: false,
      command: null,
      response: translate(language, {
        en: "Type a request first. For example: Create customer Ahmed Electronics.",
        romanUr:
          "Pehle apni request likhein. Misal: Create customer Ahmed Electronics.",
        ur: "پہلے اپنی درخواست لکھیں۔ مثال: Create customer Ahmed Electronics.",
      }),
    };
  }

  if (matchesCreateCustomerIntent(input, normalized)) {
    const name = extractCreateCustomerName(input);
    const missingFields = name ? [] : ["name"];
    const command = finalizeCommand(
      {
        intent: "create_customer",
        entity: "customer",
        action: "create",
        language,
        operation: "create_customer",
        data: { name, status: "ACTIVE" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      name
        ? translate(language, {
            en: `I can create ${name} as a new customer record.`,
            romanUr: `Main ${name} ko naya customer bana sakta hoon.`,
            ur: `میں ${name} کو نئے کسٹمر ریکارڈ کے طور پر بنا سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I understood you want to create a customer, but I need the customer name.",
            romanUr:
              "Main samjha ke aap customer banana chahte hain, lekin mujhe customer ka naam chahiye.",
            ur: "میں سمجھا کہ آپ کسٹمر بنانا چاہتے ہیں، لیکن مجھے کسٹمر کا نام چاہیے۔",
          }),
      missingFields,
      0.95
    );
    return buildResult(command, command.message);
  }

  if (
    (/^(update)\s+customer\s+/i.test(input) && /\s+to\s+/i.test(input)) ||
    /\bcustomer\b.*\bupdate\b/i.test(normalized)
  ) {
    const match =
      input.match(/^update\s+customer\s+(.+?)\s+to\s+(.+)$/i) ||
      input.match(/^customer\s+(.+?)\s+ko\s+(.+?)\s+kar\s+do$/i);
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
        language,
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
        ? translate(language, {
            en: `I can update ${exactCustomer.label} to ${status}.`,
            romanUr: `Main ${exactCustomer.label} ko ${status} kar sakta hoon.`,
            ur: `میں ${exactCustomer.label} کو ${status} کر سکتا ہوں۔`,
          })
        : customerCandidates.length > 1
          ? translate(language, {
              en: `I found multiple customers for "${customerName}". Please choose the right one before I update the status.`,
              romanUr: `"${customerName}" ke liye mujhe multiple customers mile. Status update se pehle sahi customer choose karein.`,
              ur: `"${customerName}" کے لیے مجھے ایک سے زیادہ کسٹمر ملے۔ اسٹیٹس اپڈیٹ سے پہلے درست کسٹمر منتخب کریں۔`,
            })
          : translate(language, {
              en: "I need a matching customer and target status before I can update the record.",
              romanUr:
                "Record update karne se pehle mujhe sahi customer aur target status chahiye.",
              ur: "ریکارڈ اپڈیٹ کرنے سے پہلے مجھے درست کسٹمر اور مطلوبہ اسٹیٹس چاہیے۔",
            }),
      missingFields,
      exactCustomer ? 0.92 : 0.6
    );
    return buildResult(command, command.message);
  }

  if (/customer\s+.+\s+history/i.test(input) || /\bcustomer\b.*\bhistory\b/i.test(normalized)) {
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
        language,
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
        ? translate(language, {
            en: `I can load the transaction history for ${exactCustomer.label}.`,
            romanUr: `Main ${exactCustomer.label} ki transaction history dikha sakta hoon.`,
            ur: `میں ${exactCustomer.label} کی ٹرانزیکشن ہسٹری دکھا سکتا ہوں۔`,
          })
        : customerCandidates.length > 1
          ? translate(language, {
              en: `I found multiple customers for "${customerName}". Please choose one to see the history.`,
              romanUr: `"${customerName}" ke liye multiple customers mile. History dekhne ke liye ek choose karein.`,
              ur: `"${customerName}" کے لیے ایک سے زیادہ کسٹمر ملے۔ ہسٹری دیکھنے کے لیے ایک منتخب کریں۔`,
            })
          : translate(language, {
              en: "I need a customer name before I can pull the history.",
              romanUr: "History nikalne ke liye mujhe customer ka naam chahiye.",
              ur: "ہسٹری نکالنے کے لیے مجھے کسٹمر کا نام چاہیے۔",
            }),
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
        language,
        operation: "query_customer_search",
        data: { customerName },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      customerName
        ? translate(language, {
            en: `I can search for customer matches for "${customerName}".`,
            romanUr: `Main "${customerName}" ke customer matches dhoond sakta hoon.`,
            ur: `میں "${customerName}" کے کسٹمر میچز تلاش کر سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I need a customer name or keyword to search.",
            romanUr: "Search karne ke liye mujhe customer ka naam ya keyword chahiye.",
            ur: "تلاش کے لیے مجھے کسٹمر کا نام یا کی ورڈ چاہیے۔",
          }),
      customerName ? [] : ["customer search term"],
      0.9
    );
    return buildResult(command, command.message);
  }

  if (matchesCreateInvoiceIntent(input, normalized)) {
    const { customerName, quantity, productName, unitPrice } = extractInvoiceIntentParts(input);
    const customerCandidates = customerName ? await findCustomerCandidates(db, customerName) : [];
    const productCandidates = productName ? await findProductCandidates(db, branchId, productName) : [];
    const exactCustomer = resolveCandidate(customerCandidates);
    const exactProduct = resolveCandidate(productCandidates);

    const missingFields: string[] = [];
    if (!customerName || !exactCustomer) {
      missingFields.push(customerCandidates.length > 1 ? "customer selection" : "customer");
    }
    if (!productName || !exactProduct) {
      missingFields.push(productCandidates.length > 1 ? "product selection" : "product");
    }
    if (!quantity) missingFields.push("quantity");
    if (unitPrice === null) missingFields.push("unit price");

    const command = finalizeCommand(
      {
        intent: "create_invoice",
        entity: "invoice",
        action: "create",
        language,
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
        ? translate(language, {
            en: `I can create a draft invoice for ${exactCustomer.label} with ${quantity} x ${exactProduct.label} at ${unitPrice.toLocaleString()} each.`,
            romanUr: `Main ${exactCustomer.label} ke liye ${quantity} x ${exactProduct.label} ka draft invoice ${unitPrice.toLocaleString()} per item bana sakta hoon.`,
            ur: `میں ${exactCustomer.label} کے لیے ${quantity} x ${exactProduct.label} کا ڈرافٹ انوائس ${unitPrice.toLocaleString()} فی آئٹم کے حساب سے بنا سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I can prepare a draft invoice, but I still need you to confirm the customer, product, quantity, or rate.",
            romanUr:
              "Main draft invoice tayar kar sakta hoon, lekin mujhe customer, product, quantity, ya rate confirm chahiye.",
            ur: "میں ڈرافٹ انوائس تیار کر سکتا ہوں، لیکن مجھے کسٹمر، پروڈکٹ، مقدار یا ریٹ کی تصدیق چاہیے۔",
          }),
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
        language,
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
        ? translate(language, {
            en: `I can mark ${exactInvoice.label} as paid after your confirmation.`,
            romanUr: `Main aap ki confirmation ke baad ${exactInvoice.label} ko paid mark kar sakta hoon.`,
            ur: `میں آپ کی تصدیق کے بعد ${exactInvoice.label} کو paid مارک کر سکتا ہوں۔`,
          })
        : invoiceCandidates.length > 1
          ? translate(language, {
              en: `I found multiple invoice matches for "${invoiceNumber}". Please choose one before I mark it as paid.`,
              romanUr:
                `"${invoiceNumber}" ke liye multiple invoices mile. Paid mark karne se pehle ek select karein.`,
              ur: `"${invoiceNumber}" کے لیے ایک سے زیادہ انوائس ملے۔ paid مارک کرنے سے پہلے ایک منتخب کریں۔`,
            })
          : translate(language, {
              en: "I need a valid invoice number before I can mark it as paid.",
              romanUr: "Paid mark karne se pehle mujhe valid invoice number chahiye.",
              ur: "paid مارک کرنے سے پہلے مجھے درست invoice number چاہیے۔",
            }),
      missingFields,
      exactInvoice ? 0.94 : 0.55
    );
    return buildResult(command, command.message);
  }

  if (
    /show\s+unpaid\s+invoices\s+this\s+month/i.test(normalized) ||
    /unpaid\s+invoices?\s+(?:is|this)\s+month/i.test(normalized) ||
    /\bunpaid\s+invoices?\s+dikhao\b/i.test(normalized)
  ) {
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "invoice",
        action: "fetch",
        language,
        operation: "query_unpaid_invoices",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: `I can list unpaid invoices for ${currentMonthLabel()}.`,
        romanUr: `Main ${currentMonthLabel()} ki unpaid invoices dikha sakta hoon.`,
        ur: `میں ${currentMonthLabel()} کی غیر ادا شدہ انوائسز دکھا سکتا ہوں۔`,
      }),
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
        language,
        operation: "query_invoices_this_month",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: "I can list this month's invoices for your current workspace.",
        romanUr: "Main is month ki invoices aap ke current workspace ke liye dikha sakta hoon.",
        ur: "میں آپ کے موجودہ workspace کے لیے اس ماہ کی انوائسز دکھا سکتا ہوں۔",
      }),
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
        language,
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
        ? translate(language, {
            en: `I can list invoices for ${exactCustomer.label}.`,
            romanUr: `Main ${exactCustomer.label} ki invoices dikha sakta hoon.`,
            ur: `میں ${exactCustomer.label} کی انوائسز دکھا سکتا ہوں۔`,
          })
        : customerCandidates.length > 1
          ? translate(language, {
              en: `I found multiple customers for "${customerName}". Please choose one before I load invoices.`,
              romanUr: `"${customerName}" ke liye multiple customers mile. Invoices load karne se pehle ek choose karein.`,
              ur: `"${customerName}" کے لیے ایک سے زیادہ کسٹمر ملے۔ انوائسز لوڈ کرنے سے پہلے ایک منتخب کریں۔`,
            })
          : translate(language, {
              en: "I need a customer name before I can load invoices.",
              romanUr: "Invoices load karne ke liye mujhe customer ka naam chahiye.",
              ur: "انوائسز لوڈ کرنے کے لیے مجھے کسٹمر کا نام چاہیے۔",
            }),
      missingFields,
      exactCustomer ? 0.92 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (
    /show\s+low\s+stock|low\s+stock/i.test(normalized) ||
    /\blow\s+stock\s+dikhao\b/i.test(normalized) ||
    /کم\s+اسٹاک/u.test(input)
  ) {
    const command = finalizeCommand(
      {
        intent: "query_data",
        entity: "inventory",
        action: "fetch",
        language,
        operation: "query_low_stock",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: "I can show products that are below their low-stock threshold.",
        romanUr: "Main woh products dikha sakta hoon jo low-stock threshold se neeche hain.",
        ur: "میں وہ پروڈکٹس دکھا سکتا ہوں جو low-stock threshold سے نیچے ہیں۔",
      }),
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  if (/check\s+stock|show\s+stock|stock\s+of/i.test(normalized) || /\bstock\s+dikhao\b/i.test(normalized)) {
    const match =
      input.match(/(?:check|show)\s+stock(?:\s+of)?\s+(.+)$/i) ||
      input.match(/stock\s+of\s+(.+)$/i) ||
      input.match(/(.+?)\s+ka\s+stock\s+dikhao$/i);
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
        language,
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
        ? translate(language, {
            en: `I can check the live stock level for ${exactProduct.label}.`,
            romanUr: `Main ${exactProduct.label} ka live stock level check kar sakta hoon.`,
            ur: `میں ${exactProduct.label} کا live stock level چیک کر سکتا ہوں۔`,
          })
        : productCandidates.length > 1
          ? translate(language, {
              en: `I found multiple products for "${productName}". Please choose one before I check stock.`,
              romanUr: `"${productName}" ke liye multiple products mile. Stock check karne se pehle ek choose karein.`,
              ur: `"${productName}" کے لیے ایک سے زیادہ پروڈکٹس ملے۔ اسٹاک چیک کرنے سے پہلے ایک منتخب کریں۔`,
            })
          : translate(language, {
              en: "I need a product name before I can check stock.",
              romanUr: "Stock check karne ke liye mujhe product ka naam chahiye.",
              ur: "اسٹاک چیک کرنے کے لیے مجھے پروڈکٹ کا نام چاہیے۔",
            }),
      missingFields,
      exactProduct ? 0.92 : 0.56
    );
    return buildResult(command, command.message);
  }

  if (
    (/^(add|increase)\s+[\d,]+/i.test(input) && /(inventory|stock)/i.test(input)) ||
    /\bstock\s+add\s+karo\b/i.test(normalized)
  ) {
    const match =
      input.match(/^add\s+([\d,]+(?:\.\d+)?)\s+(.+?)\s+of\s+(.+?)(?:\s+to\s+(?:inventory|stock))?$/i) ||
      input.match(/^add\s+([\d,]+(?:\.\d+)?)\s+(.+?)(?:\s+to\s+(?:inventory|stock))$/i) ||
      input.match(/^(.+?)\s+mein\s+([\d,]+(?:\.\d+)?)\s+(.+?)\s+stock\s+add\s+karo$/i);
    const quantity = parseAmount(match?.[1] || match?.[2]) ?? null;
    const productName = (match?.[3] || match?.[2] || match?.[1] || "").trim();
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
        language,
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
        ? translate(language, {
            en: `I can add ${quantity} units to ${exactProduct.label}.`,
            romanUr: `Main ${quantity} units ${exactProduct.label} mein add kar sakta hoon.`,
            ur: `میں ${quantity} یونٹس ${exactProduct.label} میں add کر سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I can update stock, but I still need the exact product and quantity.",
            romanUr: "Main stock update kar sakta hoon, lekin mujhe exact product aur quantity chahiye.",
            ur: "میں اسٹاک اپڈیٹ کر سکتا ہوں، لیکن مجھے درست پروڈکٹ اور مقدار چاہیے۔",
          }),
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
        language,
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
        ? translate(language, {
            en: `I can set ${exactProduct.label} stock to ${quantity}.`,
            romanUr: `Main ${exactProduct.label} ka stock ${quantity} par set kar sakta hoon.`,
            ur: `میں ${exactProduct.label} کا اسٹاک ${quantity} پر سیٹ کر سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I need the product and target quantity before I can set stock.",
            romanUr: "Stock set karne se pehle mujhe product aur target quantity chahiye.",
            ur: "اسٹاک سیٹ کرنے سے پہلے مجھے پروڈکٹ اور مطلوبہ مقدار چاہیے۔",
          }),
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
        language,
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
        ? translate(language, {
            en: `I can add ${name} to your product catalog.`,
            romanUr: `Main ${name} ko aap ke product catalog mein add kar sakta hoon.`,
            ur: `میں ${name} کو آپ کے product catalog میں شامل کر سکتا ہوں۔`,
          })
        : translate(language, {
            en: "I can add the product, but I still need the missing pricing details.",
            romanUr: "Main product add kar sakta hoon, lekin mujhe pricing details abhi chahiye.",
            ur: "میں پروڈکٹ شامل کر سکتا ہوں، لیکن مجھے ابھی pricing details چاہیے۔",
          }),
      missingFields,
      missingFields.length === 0 ? 0.9 : 0.6
    );
    return buildResult(command, command.message);
  }

  if (/daily\s+sales\s+summary/i.test(normalized) || /\btoday\s+sales\b/i.test(normalized)) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        language,
        operation: "report_daily_sales",
        data: { period: "today" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: "I can generate today's sales summary for this tenant.",
        romanUr: "Main aaj ki sales summary is tenant ke liye generate kar sakta hoon.",
        ur: "میں آج کی sales summary اس tenant کے لیے generate کر سکتا ہوں۔",
      }),
      [],
      0.98
    );
    return buildResult(command, command.message);
  }

  if (
    /monthly\s+sales\s+summary|generate\s+monthly\s+sales\s+report/i.test(normalized) ||
    /\bmonthly\s+sales\s+report\b/i.test(normalized) ||
    /\bsales\s+report\s+dikhao\b/i.test(normalized)
  ) {
    const command = finalizeCommand(
      {
        intent: "generate_report",
        entity: "report",
        action: "generate",
        language,
        operation: "report_monthly_sales",
        data: { period: "this_month" },
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: `I can generate the monthly sales summary for ${currentMonthLabel()}.`,
        romanUr: `Main ${currentMonthLabel()} ki monthly sales summary generate kar sakta hoon.`,
        ur: `میں ${currentMonthLabel()} کی monthly sales summary generate کر سکتا ہوں۔`,
      }),
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
        language,
        operation: "report_inventory",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: "I can generate an inventory report for the active branch.",
        romanUr: "Main active branch ke liye inventory report generate kar sakta hoon.",
        ur: "میں active branch کے لیے inventory report generate کر سکتا ہوں۔",
      }),
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
        language,
        operation: "report_unpaid_invoices",
        data: {},
        requiresConfirmation: true,
        options: { customers: [], products: [], invoices: [] },
      },
      translate(language, {
        en: "I can generate an unpaid invoice report for this workspace.",
        romanUr: "Main is workspace ke liye unpaid invoice report generate kar sakta hoon.",
        ur: "میں اس workspace کے لیے unpaid invoice report generate کر سکتا ہوں۔",
      }),
      [],
      0.97
    );
    return buildResult(command, command.message);
  }

  return unsupportedResult(language);
}
