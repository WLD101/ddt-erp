import { captureOperationalError } from "./error-tracker";

const globalForMonitoring = globalThis as {
  __whatsqueryMonitoringBootstrapped?: boolean;
};

export function bootstrapMonitoringHooks() {
  if (globalForMonitoring.__whatsqueryMonitoringBootstrapped) {
    return;
  }

  globalForMonitoring.__whatsqueryMonitoringBootstrapped = true;

  process.on("unhandledRejection", (reason) => {
    void captureOperationalError("process.unhandledRejection", reason);
  });

  process.on("uncaughtException", (error) => {
    void captureOperationalError("process.uncaughtException", error);
  });
}
