import { MONITORING_PATHS } from "./config";
import { appendJsonLine } from "./logging";

export async function captureOperationalError(
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  const payload = {
    timestamp: new Date().toISOString(),
    source,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    metadata: metadata || null,
  };

  try {
    await appendJsonLine(MONITORING_PATHS.errorLog, payload);
  } catch (loggingError) {
    console.error("[monitoring:error-tracker] failed to persist error", loggingError);
  }
}
