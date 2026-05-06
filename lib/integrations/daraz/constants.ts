import { SalesChannelType } from "../shared";

export const DARAZ_CHANNEL_TYPE: SalesChannelType = "DARAZ";
export const DEFAULT_DARAZ_API_BASE_URL =
  process.env.DARAZ_API_BASE_URL || "https://api.daraz.com/rest";

// TODO: Confirm the exact Open Platform endpoints against the tenant's seller app credentials.
// These constants preserve the official credential shape while keeping demo mode fully usable today.
export const DARAZ_ENDPOINTS = {
  sellerProfile: "/seller/profile/get",
  products: "/products/get",
  orders: "/orders/get",
  orderItems: "/order/items/get",
  inventory: "/product/price_quantity/update",
  productCreate: "/product/create",
} as const;

export const DARAZ_ORDER_STATUS_TO_INVOICE_STATUS: Record<string, "DRAFT" | "SENT" | "PAID" | "OVERDUE"> = {
  pending: "DRAFT",
  unpaid: "DRAFT",
  packed: "SENT",
  shipped: "SENT",
  delivered: "PAID",
  completed: "PAID",
  canceled: "OVERDUE",
  returned: "OVERDUE",
};
