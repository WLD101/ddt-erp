import { ChannelIntegrationAdapter } from "../shared/contracts";

import {
  getWooSyncLogs,
  pushWooInventory,
  syncWooOrders,
  syncWooProducts,
  testWooConnection,
} from "./service";

export * from "./constants";
export * from "./mapper";
export * from "./service";
export * from "./types";

export const woocommerceIntegration: ChannelIntegrationAdapter = {
  type: "WOOCOMMERCE",
  async connectChannel(context) {
    return testWooConnection(context);
  },
  async testConnection(context) {
    return testWooConnection(context);
  },
  async syncProducts(context) {
    return syncWooProducts(context);
  },
  async syncOrders(context) {
    return syncWooOrders(context);
  },
  async pushInventory(context) {
    return pushWooInventory(context);
  },
  async getSyncLogs(context) {
    return getWooSyncLogs(context);
  },
};
