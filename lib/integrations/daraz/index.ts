import { ChannelIntegrationAdapter } from "../shared/contracts";

import { getDarazSyncLogs, pushDarazInventory, syncDarazOrders, syncDarazProducts, testDarazConnection } from "./service";

export * from "./constants";
export * from "./client";
export * from "./mapper";
export * from "./product-create";
export * from "./service";
export * from "./signature";
export * from "./types";

export const darazIntegration: ChannelIntegrationAdapter = {
  type: "DARAZ",
  async connectChannel(context) {
    return testDarazConnection(context);
  },
  async testConnection(context) {
    return testDarazConnection(context);
  },
  async syncProducts(context) {
    return syncDarazProducts(context);
  },
  async syncOrders(context) {
    return syncDarazOrders(context);
  },
  async pushInventory(context) {
    return pushDarazInventory(context);
  },
  async getSyncLogs(context) {
    return getDarazSyncLogs(context);
  },
};
