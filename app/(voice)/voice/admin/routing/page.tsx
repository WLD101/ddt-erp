import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { maskPhoneNumber } from "@/modules/calls/masking";
import { listProvidersAndRouting } from "@/modules/calls/service";
import { RoutingSimulatorClient } from "./RoutingSimulatorClient";

export const dynamic = "force-dynamic";

export default async function VoiceAdminRoutingPage() {
  const { providers, rules } = await listProvidersAndRouting();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [routes, calls, failures, tenants, invalidWebhookCount] = await Promise.all([
    prisma.callRoute.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        selectedProvider: { select: { name: true, type: true, countryCode: true } },
        tenant: { select: { name: true, slug: true } },
      },
    }),
    prisma.call.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { name: true, slug: true } },
        attempts: {
          orderBy: { attemptNumber: "asc" },
          include: { provider: { select: { name: true, type: true } } },
        },
      },
    }),
    prisma.callAttempt.findMany({
      where: { status: "FAILED", createdAt: { gte: since } },
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        call: { include: { tenant: { select: { name: true, slug: true } } } },
        provider: { select: { name: true, type: true } },
      },
    }),
    prisma.organization.findMany({
      take: 100,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.callEvent.count({
      where: {
        eventType: { in: ["invalid_signature", "unknown_mapping", "replay_detected"] },
        receivedAt: { gte: since },
      },
    }),
  ]);

  const activeCalls = calls.filter((call) => ["QUEUED", "INITIATING", "RINGING", "IN_PROGRESS"].includes(call.status)).length;
  const fallbackUsage = calls.filter((call) => call.attempts.length > 1).length;
  const providerCounts = {
    configured: providers.length,
    healthy: providers.filter((provider) => provider.healthStatus === "HEALTHY").length,
    degraded: providers.filter((provider) => provider.healthStatus === "DEGRADED").length,
    unhealthy: providers.filter((provider) => provider.healthStatus === "UNHEALTHY").length,
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Country Provider Routing</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-on-surface">Telecom Routing Command Center</h1>
        <p className="mt-3 max-w-3xl text-sm text-on-surface-variant">
          Pakistan routes through local SIP/Asterisk. USA and UK routes through Twilio-style routing. This dashboard is operational only: health checks and simulations never place calls.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Configured Providers" value={providerCounts.configured} />
        <Metric label="Healthy / Degraded" value={`${providerCounts.healthy} / ${providerCounts.degraded}`} />
        <Metric label="Active Calls" value={activeCalls} />
        <Metric label="Fallback / Invalid Webhooks" value={`${fallbackUsage} / ${invalidWebhookCount}`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-3xl border border-outline-variant/40 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-on-surface">{provider.name}</p>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-black uppercase text-on-surface-variant">{provider.healthStatus}</span>
            </div>
            <p className="mt-3 text-2xl font-black text-primary">{provider.countryCode || "Global"}</p>
            <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
              <p>Type: {provider.type.replace("_", " ")}</p>
              <p>Configured: {provider.status}</p>
              <p>Manual: {provider.manualHealthStatus || "None"}</p>
              <p>Active calls: {provider.concurrentActiveCalls}</p>
              <p>Success rate: {provider.recentSuccessRate ?? "Not enough data"}%</p>
              <p>Last check: {provider.lastHealthCheckAt ? provider.lastHealthCheckAt.toLocaleString() : "Never"}</p>
              <p>Error summary: {provider.healthMessage || "No recent health message"}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-outline-variant/40 bg-white shadow-soft">
        <div className="border-b border-outline-variant/40 p-6">
          <h2 className="text-2xl font-black tracking-tight text-on-surface">Routing Rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Prefix</th>
                <th className="px-6 py-4">Primary</th>
                <th className="px-6 py-4">Priority / Weight</th>
                <th className="px-6 py-4">Health Required</th>
                <th className="px-6 py-4">Fallback</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t border-outline-variant/30">
                  <td className="px-6 py-4 font-bold">{rule.countryName} ({rule.isoCode})</td>
                  <td className="px-6 py-4">{rule.prefix || rule.dialCode}</td>
                  <td className="px-6 py-4">{rule.provider.name}</td>
                  <td className="px-6 py-4">{rule.priority} / {rule.weight}</td>
                  <td className="px-6 py-4">{rule.requireHealthyProvider ? "Yes" : "No"}</td>
                  <td className="px-6 py-4">{rule.fallbackEligible ? rule.fallbackProvider?.name || "None" : "Disabled"}</td>
                  <td className="px-6 py-4">{rule.isActive ? "Active" : "Paused"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-tight text-on-surface">Route Simulator</h2>
        <RoutingSimulatorClient tenants={tenants} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent Route Decisions" empty={routes.length === 0 ? "No route decisions recorded yet." : null}>
          {routes.map((route) => (
            <div key={route.id} className="p-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <p className="font-black text-on-surface">{maskPhoneNumber(route.toNumber)}</p>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase">{route.status}</span>
              </div>
              <p className="mt-1 text-on-surface-variant">{route.tenant.name} - {route.selectedProvider.name} - {route.detectedCountry}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{route.routeReason}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Recent Failures" empty={failures.length === 0 ? "No provider failures in the selected period." : null}>
          {failures.map((failure) => (
            <div key={failure.id} className="p-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <p className="font-black text-on-surface">{maskPhoneNumber(failure.destinationE164)}</p>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700">{failure.failureClass || failure.status}</span>
              </div>
              <p className="mt-1 text-on-surface-variant">{failure.call.tenant.name} - {failure.provider.name} - attempt #{failure.attemptNumber}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{failure.failureCode || failure.failureMessage || "No provider error detail"}</p>
            </div>
          ))}
        </Panel>
      </section>

      <section className="rounded-3xl border border-outline-variant/40 bg-white shadow-soft">
        <div className="border-b border-outline-variant/40 p-6">
          <h2 className="text-xl font-black tracking-tight text-on-surface">Call Explorer</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Logical calls are the source of truth. Legacy route/log rows are compatibility projections.</p>
        </div>
        <div className="divide-y divide-outline-variant/30">
          {calls.length === 0 ? (
            <p className="p-6 text-sm text-on-surface-variant">No logical calls recorded yet.</p>
          ) : calls.map((call) => (
            <details key={call.id} className="p-5 text-sm">
              <summary className="cursor-pointer font-black text-on-surface">
                {call.tenant.name} - {maskPhoneNumber(call.destinationE164)} - {call.status}
              </summary>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p>Call ID: {call.id}</p>
                  <p>Created: {call.createdAt.toLocaleString()}</p>
                  <p>Idempotency: {call.idempotencyKey ? "Present (masked)" : "None"}</p>
                  <p>Country: {call.destinationCountry || "Unknown"}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  {call.attempts.map((attempt) => (
                    <p key={attempt.id}>
                      #{attempt.attemptNumber} {attempt.provider.name} - {attempt.status} - {attempt.failureClass || "no failure"}
                    </p>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-outline-variant/40 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">{label}</p>
      <p className="mt-3 text-3xl font-black text-primary">{value}</p>
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string | null; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-outline-variant/40 bg-white shadow-soft">
      <div className="border-b border-outline-variant/40 p-6">
        <h2 className="text-xl font-black tracking-tight text-on-surface">{title}</h2>
      </div>
      <div className="divide-y divide-outline-variant/30">
        {empty ? <p className="p-6 text-sm text-on-surface-variant">{empty}</p> : children}
      </div>
    </div>
  );
}
