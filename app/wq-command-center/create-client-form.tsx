"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClientFromCommandCenterAction, type CreateClientState } from "@/modules/command-center/actions";

const INITIAL_STATE: CreateClientState = {
  success: false,
  message: "",
};

const COUNTRY_OPTIONS = ["United States", "United Kingdom", "United Arab Emirates", "Saudi Arabia", "Pakistan", "Canada", "Australia"];
const PACKAGE_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "business", label: "Business" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
] as const;

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  Pakistan: "PKR",
  "United Kingdom": "GBP",
  "United Arab Emirates": "AED",
  "United States": "USD",
  "Saudi Arabia": "SAR",
  Canada: "CAD",
  Australia: "AUD",
};

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState(createClientFromCommandCenterAction, INITIAL_STATE);
  const [country, setCountry] = useState("United States");
  const [packageMode, setPackageMode] = useState<"standard" | "custom">("standard");
  const [accountMode, setAccountMode] = useState<"paid" | "demo">("paid");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY" | "CUSTOM">("MONTHLY");
  const currencyHint = CURRENCY_BY_COUNTRY[country] || "Auto";
  const renewalLabel = useMemo(() => (billingCycle === "CUSTOM" ? "Custom expiry date" : "Renewal date override"), [billingCycle]);

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft">
      <div className="space-y-1 pb-2 border-b border-outline-variant/20">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">add_circle</span> Enterprise Registration
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="organizationName"
          placeholder="Business Name"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          required
        />
        <input
          name="organizationPhone"
          placeholder="Primary Phone (Optional)"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
        />
        <input
          name="ownerName"
          placeholder="Full Administrator Name"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
        />
        <input
          name="ownerEmail"
          type="email"
          placeholder="Owner Credentials / Email"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          required
        />
        <select
          id="create-client-country"
          name="country"
          defaultValue="United States"
          onChange={(event) => setCountry(event.target.value)}
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          required
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex h-11 items-center rounded-xl border border-outline-variant bg-surface-container-low px-4 text-xs font-medium text-on-surface-variant">
          Ledger Currency: <span className="ml-2 font-black text-primary text-sm tracking-wide">{currencyHint}</span>
        </div>
        <select
          name="industry"
          defaultValue="wholesale"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          required
        >
          <option value="wholesale">Trading & Wholesale</option>
          <option value="ecommerce">Modern Commerce</option>
          <option value="retail">Direct Retail</option>
          <option value="distribution">Supply Distribution</option>
          <option value="manufacturing">Local Manufacturing</option>
          <option value="service_basic">General Services</option>
        </select>
        <select
          name="packageId"
          defaultValue="starter"
          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          required
        >
          {PACKAGE_OPTIONS.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              Standard: {pkg.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-outline-variant/20">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Access Mode</label>
          <select
            name="accountMode"
            value={accountMode}
            onChange={(event) => setAccountMode(event.target.value as "paid" | "demo")}
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          >
            <option value="paid">PROD: Paid Live</option>
            <option value="demo">TEST: Demo Trial</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Policy Strategy</label>
          <select
            name="packageMode"
            value={packageMode}
            onChange={(event) => setPackageMode(event.target.value as "standard" | "custom")}
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          >
            <option value="standard">Catalog Defaults</option>
            <option value="custom">Enterprise Contract Override</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Billing Tempo</label>
          <select
            name="billingCycle"
            value={billingCycle}
            onChange={(event) => setBillingCycle(event.target.value as "MONTHLY" | "YEARLY" | "CUSTOM")}
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          >
            <option value="MONTHLY">Monthly Lock</option>
            <option value="YEARLY">Yearly Commitment</option>
            <option value="CUSTOM">Custom Logic</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{renewalLabel}</label>
          <input
            name="renewalDate"
            type="date"
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 pt-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Injection Gate</label>
          <select
            name="manualPaymentMethod"
            defaultValue="BANK_TRANSFER"
            disabled={accountMode === "demo"}
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium disabled:opacity-50"
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Physical Cash</option>
            <option value="INVOICE">Net Term Invoice</option>
            <option value="OTHER">Custom Wire</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Payment Identifier</label>
          <input
            name="manualPaymentReference"
            placeholder="Ref Hash / ID"
            disabled={accountMode === "demo"}
            className="h-11 rounded-xl w-full border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium disabled:opacity-50"
          />
        </div>
      </div>

      {packageMode === "custom" ? (
        <div className="grid gap-3 md:grid-cols-2 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2">
          <input
            name="customPackageName"
            placeholder="Custom Plan Label"
            className="h-11 rounded-xl border border-primary/30 bg-surface-container px-3 text-sm text-on-surface outline-none font-medium col-span-2"
            required
          />
          <input
            name="customPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="Custom Rate"
            className="h-11 rounded-xl border border-primary/30 bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
          />
          <input
            name="customUserLimit"
            type="number"
            min={1}
            placeholder="Seat Count"
            className="h-11 rounded-xl border border-primary/30 bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
            required
          />
          <textarea
            name="customFeatures"
            placeholder="Features override, one per line"
            className="min-h-24 rounded-xl border border-primary/30 bg-surface-container px-3 py-3 text-sm text-on-surface outline-none font-medium resize-none col-span-2"
          />
        </div>
      ) : null}

      <div className="pt-2">
        <textarea
          name="adminNotes"
          placeholder="Internal Audit & Support Notes (Optional)..."
          className="min-h-20 w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-3 text-sm text-on-surface outline-none font-medium resize-none"
        />
      </div>

      <button 
        type="submit" 
        className="w-full h-12 bg-primary text-on-primary font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        disabled={pending}
      >
        {pending ? (
          <>Processing Engine...</>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Provision & Instantiate Business
          </>
        )}
      </button>

      {state.message ? (
        <div className={`rounded-xl border px-4 py-3 text-xs font-medium shadow-soft flex items-center gap-3 ${state.success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800" : "border-rose-500/30 bg-rose-500/10 text-rose-800"}`}>
          <span className="material-symbols-outlined text-[18px]">{state.success ? 'check_circle' : 'error'}</span>
          <div>
            {state.message}
            {state.email && <div className="font-bold mt-0.5">Routed via: {state.email}</div>}
          </div>
        </div>
      ) : null}
    </form>
  );
}
