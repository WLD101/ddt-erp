import { ChannelIntegrationAdapter } from "../shared/contracts";
import {
  buildConnectionResult,
  buildPlaceholderLogs,
  buildSyncResult,
} from "../shared/placeholders";

export const csvIntegration: ChannelIntegrationAdapter = {
  type: "CSV",
  async connectChannel() {
    return buildConnectionResult("CSV", true, "Manual import channel is ready.", [
      "Use this channel for CSV or Excel uploads from external marketplaces.",
      "File parsing can plug into this adapter without exposing credentials in the frontend.",
    ]);
  },
  async testConnection() {
    return buildConnectionResult("CSV", true, "No remote connection required.", [
      "This adapter is intended for operational imports and scheduled spreadsheet drops.",
    ]);
  },
  async syncProducts() {
    return buildSyncResult("CSV", "products", "placeholder adapter is ready for spreadsheet imports.", {
      skipped: 1,
      logs: buildPlaceholderLogs("CSV", [
        "Prepared for product normalization from CSV or Excel rows.",
      ]),
    });
  },
  async syncOrders() {
    return buildSyncResult("CSV", "orders", "placeholder adapter is ready for spreadsheet imports.", {
      skipped: 1,
      logs: buildPlaceholderLogs("CSV", [
        "Prepared for order and customer import from manual upload files.",
      ]),
    });
  },
  async pushInventory() {
    return buildSyncResult("CSV", "inventory", "manual exports are enabled by design.", {
      skipped: 1,
      logs: buildPlaceholderLogs("CSV", [
        "Prepared for ERP inventory export files when outbound API channels are unavailable.",
      ]),
    });
  },
  async getSyncLogs() {
    return buildPlaceholderLogs("CSV", [
      "Scaffolded for CSV / Excel import lifecycle.",
    ]);
  },
};
