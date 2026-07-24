import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVapiHealthSnapshot } from "@/modules/voice/vapi/health";

const cardClassName =
  "rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

export default async function VapiHealthPage() {
  const health = await getVapiHealthSnapshot();
  const metrics = [
    ["Webhook failures (24h)", health.failedEventsLast24Hours],
    ["Unresolved tenant events", health.unresolvedEvents],
    ["Calls awaiting analysis", health.awaitingAnalysis],
    ["Calls missing end state", health.staleOpenCalls],
    ["Reconciliation backlog", health.reconciliationBacklog],
    ["WhatsQuery-only calls", health.localOnlyCalls],
    ["Duplicate deliveries blocked", health.duplicateDeliveries],
    ["Dead-letter jobs", health.deadLetterJobs],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 text-on-surface">
      <section className={`${cardClassName} p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Provider health
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Vapi connection health</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Safe operational telemetry only. Credentials, caller numbers, transcripts, and recordings are never shown here.
            </p>
          </div>
          <div className={`rounded-2xl px-4 py-2 text-xs font-black ${
            health.status === "HEALTHY"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-600"
          }`}>
            {health.status}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label} className={cardClassName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className={cardClassName}>
          <CardHeader><CardTitle>Connection configuration</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>Private API credential: <strong>{health.apiCredentialConfigured ? "Configured" : "Missing"}</strong></div>
            <div>Webhook authentication: <strong>{health.webhookAuthenticationConfigured ? "Configured" : "Missing"}</strong></div>
            <div>Webhook URL: <strong className="break-all">{health.webhookUrl || "Not configured"}</strong></div>
            <div>Mapped assistants: <strong>{health.mappedAssistants}</strong></div>
            <div>Mapped phone numbers: <strong>{health.mappedPhoneNumbers}</strong></div>
            <div>Active agents missing assistant mapping: <strong>{health.missingAssistantMappings}</strong></div>
            <div>Active agents missing phone mapping: <strong>{health.missingPhoneMappings}</strong></div>
          </CardContent>
        </Card>
        <Card className={cardClassName}>
          <CardHeader><CardTitle>Latest delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {health.latestEvent ? (
              <>
                <div>Event: <strong>{health.latestEvent.eventType}</strong></div>
                <div>Status: <strong>{health.latestEvent.status}</strong></div>
                <div>Received: <strong>{health.latestEvent.receivedAt.toLocaleString()}</strong></div>
              </>
            ) : (
              <div className="text-on-surface-variant">No Vapi webhook has been stored yet.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
