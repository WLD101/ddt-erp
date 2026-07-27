import client from "prom-client";

// Ensure we don't register metrics multiple times in Next.js HMR (dev mode)
const globalForPrometheus = global as unknown as {
  registry: client.Registry;
};

export const registry = globalForPrometheus.registry || new client.Registry();

if (process.env.NODE_ENV !== "production") {
  globalForPrometheus.registry = registry;
}

// Collect default OS and Node metrics gracefully
try {
  client.collectDefaultMetrics({ register: registry });
} catch (error) {
  console.warn("Failed to collect default Prometheus metrics.", error);
}

// Business Metrics
export const voiceCallsCounter = new client.Counter({
  name: "wq_voice_calls_total",
  help: "Total number of voice calls processed",
  labelNames: ["tenant_id", "status"],
  registers: [registry],
});

export const webhookFailuresCounter = new client.Counter({
  name: "wq_webhook_failures_total",
  help: "Total number of failed webhook events",
  labelNames: ["tenant_id", "integration_type", "reason"],
  registers: [registry],
});

export const aiResponseLatency = new client.Histogram({
  name: "wq_ai_response_duration_seconds",
  help: "Duration of AI responses in seconds",
  labelNames: ["tenant_id", "model"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

export const workerRetryCounter = new client.Counter({
  name: "wq_worker_retry_total",
  help: "Total number of background worker retries",
  labelNames: ["queue_name", "job_name"],
  registers: [registry],
});

export const ordersCreatedCounter = new client.Counter({
  name: "wq_orders_created_total",
  help: "Total number of orders created",
  labelNames: ["tenant_id"],
  registers: [registry],
});

export const bookingsCreatedCounter = new client.Counter({
  name: "wq_bookings_created_total",
  help: "Total number of bookings created",
  labelNames: ["tenant_id"],
  registers: [registry],
});

export const leadsCapturedCounter = new client.Counter({
  name: "wq_leads_captured_total",
  help: "Total number of leads captured",
  labelNames: ["tenant_id"],
  registers: [registry],
});
