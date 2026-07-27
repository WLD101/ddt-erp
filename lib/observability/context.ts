import { AsyncLocalStorage } from "node:async_hooks";

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  tenantId?: string;
  branchId?: string;
  userId?: string;
  voiceCallId?: string;
  vapiCallId?: string;
  queueJobId?: string;
  integrationId?: string;
  correlationId?: string;
}

export const loggerContext = new AsyncLocalStorage<LogContext>();

/**
 * Runs a function within a new logging context, merging with any existing context.
 */
export function withLogContext<T>(context: Partial<LogContext>, fn: () => T): T {
  const current = loggerContext.getStore() || {};
  const merged = { ...current, ...context };
  return loggerContext.run(merged, fn);
}

/**
 * Retrieves the current logging context.
 */
export function getLogContext(): LogContext {
  return loggerContext.getStore() || {};
}
