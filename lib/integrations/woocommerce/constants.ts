import { SalesChannelType } from "../shared";

export const WOOCOMMERCE_CHANNEL_TYPE: SalesChannelType = "WOOCOMMERCE";
export const DEFAULT_WOO_API_SUFFIX = "/wp-json/wc/v3";

export const WOO_ENDPOINTS = {
  systemStatus: "/system_status",
  products: "/products",
  orders: "/orders",
} as const;

export const WOO_ORDER_STATUS_TO_INVOICE_STATUS: Record<string, "DRAFT" | "SENT" | "PAID" | "OVERDUE"> = {
  pending: "DRAFT",
  "on-hold": "DRAFT",
  processing: "SENT",
  completed: "PAID",
  refunded: "OVERDUE",
  cancelled: "OVERDUE",
  failed: "OVERDUE",
};
