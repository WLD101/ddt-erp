import { SalesChannelType } from "../shared";

export const SHOPIFY_CHANNEL_TYPE: SalesChannelType = "SHOPIFY";
export const DEFAULT_SHOPIFY_API_VERSION =
  process.env.SHOPIFY_API_VERSION || "2025-01";

export const SHOPIFY_ENDPOINTS = {
  shop: "/shop.json",
  products: "/products.json",
  orders: "/orders.json",
  variant: (variantId: string) => `/variants/${variantId}.json`,
} as const;

export const SHOPIFY_FINANCIAL_TO_INVOICE_STATUS: Record<
  string,
  "DRAFT" | "SENT" | "PAID" | "OVERDUE"
> = {
  pending: "DRAFT",
  authorized: "SENT",
  partially_paid: "SENT",
  paid: "PAID",
  partially_refunded: "OVERDUE",
  refunded: "OVERDUE",
  voided: "OVERDUE",
};
