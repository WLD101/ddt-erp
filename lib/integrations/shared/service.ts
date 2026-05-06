import { ChannelIntegrationAdapter } from "./contracts";
import { darazIntegration } from "../daraz";
import { shopifyIntegration } from "../shopify";
import { woocommerceIntegration } from "../woocommerce";
import { csvIntegration } from "../csv";
import { SalesChannelType } from "./types";

const ADAPTERS: Record<SalesChannelType, ChannelIntegrationAdapter> = {
  DARAZ: darazIntegration,
  SHOPIFY: shopifyIntegration,
  WOOCOMMERCE: woocommerceIntegration,
  CSV: csvIntegration,
};

export function getChannelAdapter(type: SalesChannelType) {
  return ADAPTERS[type];
}
