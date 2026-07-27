export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { OTLPMetricExporter } = await import(
      "@opentelemetry/exporter-metrics-otlp-http"
    );

    // Graceful degradation: if OTLP endpoints are not defined, we only use console/memory or disable.
    // The auto-instrumentations will still create traces/spans that our logger can use.
    
    const sdk = new NodeSDK({
      traceExporter: process.env.OTLP_TRACE_URL 
        ? new OTLPTraceExporter({ url: process.env.OTLP_TRACE_URL })
        : undefined, // Disables remote export, but local traces still exist
      metricReader: process.env.OTLP_METRICS_URL
        ? new (await import("@opentelemetry/sdk-metrics")).PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({ url: process.env.OTLP_METRICS_URL }),
          })
        : undefined,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    try {
      sdk.start();
      console.log("OpenTelemetry initialized successfully.");
    } catch (error) {
      console.warn("Failed to initialize OpenTelemetry. Application will gracefully degrade without remote telemetry.", error);
    }
  }
}
