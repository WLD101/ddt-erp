"use client";

import { useState, useTransition } from "react";

type TenantOption = { id: string; name: string };

export function RoutingSimulatorClient({ tenants }: { tenants: TenantOption[] }) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [destination, setDestination] = useState("+923001234567");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSimulation() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/routing-rules/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, destination }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload.error?.message || "Route simulation failed.");
        return;
      }
      setResult(payload.data);
    });
  }

  return (
    <div className="rounded-3xl border border-outline-variant/40 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <label className="flex-1 text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
          Tenant
          <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="mt-2 w-full rounded-2xl border border-outline-variant/50 px-4 py-3 text-sm normal-case tracking-normal">
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
          Destination
          <input value={destination} onChange={(event) => setDestination(event.target.value)} className="mt-2 w-full rounded-2xl border border-outline-variant/50 px-4 py-3 text-sm normal-case tracking-normal" />
        </label>
        <button
          type="button"
          onClick={runSimulation}
          disabled={!tenantId || !destination || isPending}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-soft disabled:opacity-50"
        >
          {isPending ? "Simulating..." : "Simulate Route"}
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold text-on-surface-variant">
        Simulation only. This does not place a call or contact any provider.
      </p>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Decision</p>
            <p className="mt-2 font-black text-on-surface">{result.allowed ? "Allowed" : "Blocked"}</p>
            <p className="text-on-surface-variant">{result.normalizedDestination || "No normalized number"}</p>
            <p className="text-on-surface-variant">Country: {result.countryCode || "Unknown"}</p>
            <p className="text-on-surface-variant">Provider: {result.selectedProvider?.name || result.rejectionCode || "None"}</p>
            <p className="text-on-surface-variant">Caller ID: {result.selectedCallerNumber?.maskedNumber || "Not required for simulation"}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/40">
            <div className="border-b border-outline-variant/40 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Decision Trace</div>
            <div className="max-h-72 overflow-auto divide-y divide-outline-variant/30">
              {result.decisionTrace.map((step: any) => (
                <div key={`${step.order}-${step.code}`} className="grid grid-cols-[4rem_8rem_1fr] gap-3 px-4 py-3 text-xs">
                  <span className="font-black text-on-surface-variant">#{step.order}</span>
                  <span className={step.result === "FAIL" ? "font-black text-red-700" : step.result === "SELECT" ? "font-black text-primary" : "font-black text-emerald-700"}>{step.result}</span>
                  <span><b>{step.code}</b>: {step.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
