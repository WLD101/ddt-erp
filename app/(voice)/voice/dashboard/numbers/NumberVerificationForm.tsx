"use client";

import { useState, useTransition } from "react";

export function NumberVerificationForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="rounded-3xl border border-outline-variant/40 bg-white p-6 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setMessage(null);
        startTransition(async () => {
          const response = await fetch("/api/numbers/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              number: formData.get("number"),
              countryCode: formData.get("countryCode"),
              type: formData.get("type"),
            }),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          setMessage(payload.ok ? "Verification request saved. Admin/provider verification is still required before outbound caller ID is allowed." : payload.error || "Unable to save number.");
        });
      }}
    >
      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Caller ID</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-on-surface">Add a business number</h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        Numbers are normalized to E.164 and mapped to Pakistan local SIP, USA Twilio, or UK Twilio routing.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Country</span>
          <select name="countryCode" className="h-11 w-full rounded-xl border border-outline-variant/50 bg-white px-3 text-sm">
            <option value="PK">Pakistan (+92)</option>
            <option value="US">USA (+1)</option>
            <option value="GB">UK (+44)</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Number</span>
          <input name="number" required placeholder="+923001234567" className="h-11 w-full rounded-xl border border-outline-variant/50 px-3 text-sm" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Use</span>
          <select name="type" className="h-11 w-full rounded-xl border border-outline-variant/50 bg-white px-3 text-sm">
            <option value="both">Inbound and outbound</option>
            <option value="inbound">Inbound only</option>
            <option value="outbound">Outbound caller ID</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button disabled={isPending} className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-soft disabled:opacity-60">
          {isPending ? "Saving..." : "Request Verification"}
        </button>
        {message && <p className="text-sm text-on-surface-variant">{message}</p>}
      </div>
    </form>
  );
}
