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
    <form action={formAction} className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Create paid business account</p>
        <p className="text-sm text-on-surface-variant">
          Platform-created accounts default to paid manual/offline access unless you intentionally switch them to demo.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="organizationName"
          placeholder="Organization name"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          required
        />
        <input
          name="organizationPhone"
          placeholder="Business phone (optional)"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
        />
        <input
          name="ownerName"
          placeholder="Owner / admin full name (optional)"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
        />
        <input
          name="ownerEmail"
          type="email"
          placeholder="Owner email"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          required
        />
        <select
          id="create-client-country"
          name="country"
          defaultValue="United States"
          onChange={(event) => setCountry(event.target.value)}
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          required
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex h-10 items-center rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 text-sm text-on-surface-variant">
          Currency: <span className="ml-2 font-bold text-on-surface">{currencyHint}</span>
        </div>
        <select
          name="industry"
          defaultValue="wholesale"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          required
        >
          <option value="wholesale">Trading / Wholesale</option>
          <option value="ecommerce">Ecommerce</option>
          <option value="retail">Retail</option>
          <option value="distribution">Distribution</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="service_basic">Service</option>
        </select>
        <select
          name="packageId"
          defaultValue="starter"
          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          required
        >
          {PACKAGE_OPTIONS.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              {pkg.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">Account mode</label>
          <select
            name="accountMode"
            value={accountMode}
            onChange={(event) => setAccountMode(event.target.value as "paid" | "demo")}
            className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          >
            <option value="paid">Paid manual / offline</option>
            <option value="demo">Demo / free</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">Package mode</label>
          <select
            name="packageMode"
            value={packageMode}
            onChange={(event) => setPackageMode(event.target.value as "standard" | "custom")}
            className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          >
            <option value="standard">Use existing package</option>
            <option value="custom">Custom package override</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">Billing cycle</label>
          <select
            name="billingCycle"
            value={billingCycle}
            onChange={(event) => setBillingCycle(event.target.value as "MONTHLY" | "YEARLY" | "CUSTOM")}
            className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">{renewalLabel}</label>
          <input
            name="renewalDate"
            type="date"
            className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">Manual payment method</label>
          <select
            name="manualPaymentMethod"
            defaultValue="BANK_TRANSFER"
            disabled={accountMode === "demo"}
            className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none disabled:opacity-50"
          >
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CASH">Cash</option>
            <option value="INVOICE">Invoice</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface/60">Payment reference</label>
          <input
            name="manualPaymentReference"
            placeholder="Bank ref, invoice no, or receipt note"
            disabled={accountMode === "demo"}
            className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {packageMode === "custom" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="customPackageName"
            placeholder="Custom package name"
            className="h-10 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm text-on-surface outline-none"
            required
          />
          <input
            name="customPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="Custom price"
            className="h-10 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm text-on-surface outline-none"
          />
          <input
            name="customUserLimit"
            type="number"
            min={1}
            placeholder="Custom user limit"
            className="h-10 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm text-on-surface outline-none"
            required
          />
          <input
            name="customBranchLimit"
            type="number"
            min={1}
            placeholder="Custom branch limit"
            className="h-10 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm text-on-surface outline-none"
            required
          />
          <textarea
            name="customFeatures"
            placeholder="Custom features, one per line or comma-separated"
            className="min-h-28 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-on-surface outline-none md:col-span-2"
          />
        </div>
      ) : null}

      <textarea
        name="adminNotes"
        placeholder="Admin notes (optional)"
        className="min-h-24 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 py-2 text-sm text-on-surface outline-none"
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating business..." : "Create Business"}
      </Button>

      {state.message ? (
        <div className={`rounded-xl border px-3 py-2 text-sm ${state.success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>
          {state.message}
          {state.email ? <div className="mt-1 text-xs opacity-80">Owner: {state.email}</div> : null}
        </div>
      ) : null}
    </form>
  );
}
