import fs from "fs/promises";

import { MONITORING_PATHS } from "./config";

export type BenchmarkOperationKey =
  | "search"
  | "exports"
  | "reports"
  | "dashboard"
  | "assistant";

export type BenchmarkScenarioResult = {
  size: number;
  actualRows: number;
  timingsMs: Record<BenchmarkOperationKey, number | null>;
  notes: string[];
};

export type CapacityBenchmarkReport = {
  generatedAt: string;
  organizationId: string;
  organizationName: string;
  branchId: string;
  sampleAvailability: {
    customers: number;
    products: number;
    invoices: number;
    purchases: number;
  };
  scenarios: BenchmarkScenarioResult[];
};

export async function readLatestCapacityBenchmark(): Promise<CapacityBenchmarkReport | null> {
  try {
    const raw = await fs.readFile(MONITORING_PATHS.benchmarkResults, "utf8");
    return JSON.parse(raw) as CapacityBenchmarkReport;
  } catch {
    return null;
  }
}

export async function writeCapacityBenchmark(report: CapacityBenchmarkReport) {
  await fs.mkdir(require("path").dirname(MONITORING_PATHS.benchmarkResults), { recursive: true });
  await fs.writeFile(MONITORING_PATHS.benchmarkResults, JSON.stringify(report, null, 2), "utf8");
}

