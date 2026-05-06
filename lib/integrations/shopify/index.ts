import { ChannelIntegrationAdapter } from "../shared/contracts";

import {
  getShopifySyncLogs,
  pushShopifyInventory,
  syncShopifyOrders,
  syncShopifyProducts,
  testShopifyConnection,
} from "./service";

export * from "./constants";
export * from "./mapper";
export * from "./service";
export * from "./types";

export const shopifyIntegration: ChannelIntegrationAdapter = {
  type: "SHOPIFY",
  async connectChannel(context) {
    return testShopifyConnection(context);
  },
  async testConnection(context) {
    return testShopifyConnection(context);
  },
  async syncProducts(context) {
    return syncShopifyProducts(context);
  },
  async syncOrders(context) {
    return syncShopifyOrders(context);
  },
  async pushInventory(context) {
    return pushShopifyInventory(context);
  },
  async getSyncLogs(context) {
    return getShopifySyncLogs(context);
  },
};
