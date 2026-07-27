import winston from "winston";
import { getLogContext } from "./context";
import { redactForLogging } from "@/lib/security/redaction";
import { trace, context } from "@opentelemetry/api";

const { combine, timestamp, json, printf } = winston.format;

// Format that injects the AsyncLocalStorage context and OpenTelemetry trace IDs
const injectContext = winston.format((info) => {
  const logContext = getLogContext();
  
  // Get active OpenTelemetry trace context if available
  const activeContext = context.active();
  const spanContext = trace.getSpan(activeContext)?.spanContext();

  const enriched = {
    ...info,
    ...logContext,
  };

  if (spanContext) {
    enriched.traceId = spanContext.traceId;
    enriched.spanId = spanContext.spanId;
  }

  // Safely redact the entire log payload
  return redactForLogging(enriched) as winston.Logform.TransformableInfo;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp(),
    injectContext(),
    json()
  ),
  defaultMeta: { service: "whatsquery-erp" },
  transports: [
    new winston.transports.Console({
      // Graceful fallback to console
    }),
  ],
});
