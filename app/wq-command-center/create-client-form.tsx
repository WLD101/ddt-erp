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

const fieldClassName =
  "h-11 w-full rounded-2xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

const textAreaClassName =
  "min-h-24 w-full rounded-2xl border border-outline-variant/40 bg-surface px-3 py-3 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">{title}</p>
        <p className="text-xs font-medium leading-5 text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{children}</label>;
}

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState(createClientFromCommandCenterAction, INITIAL_STATE);
  const [country, setCountry] = useState("United States");
  const [packageMode, setPackageMode] = useState<"standard" | "custom">("standard");
  const [accountMode, setAccountMode] = useState<"paid" | "demo">("paid");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY" | "CUSTOM">("MONTHLY");
  const currencyHint = CURRENCY_BY_COUNTRY[country] || "Auto";
  const renewalLabel = useMemo(() => (billingCycle === "CUSTOM" ? "Custom expiry date" : "Renewal date override"), [billingCycle]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-[28px] border border-outline-variant/30 bg-linear-to-br from-surface to-surface-container-low px-6 py-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">Business Provisioning</p>
            <h2 className="text-2xl font-black tracking-tight text-on-surface">Create a production-ready client workspace</h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant">
              Create the organization, assign its owner, choose the package model, and apply billing controls in one secure flow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px]">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface/90 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Default mode</p>
              <p className="mt-2 text-sm font-bold text-on-surface">Paid manual</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface/90 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Currency</p>
              <p className="mt-2 text-sm font-bold text-on-surface">{currencyHint}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface/90 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Package mode</p>
              <p className="mt-2 text-sm font-bold text-on-surface">{packageMode === "custom" ? "Custom contract" : "Catalog plan"}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft">
        <SectionHeader
          icon="apartment"
          title="Business and owner"
          description="Capture the workspace profile and the administrator who should receive immediate access."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Business name</FieldLabel>
            <input name="organizationName" placeholder="WhatsQuery Trading Co." className={fieldClassName} required />
          </div>
          <div className="space-y-2">
            <FieldLabel>Primary phone</FieldLabel>
            <input name="organizationPhone" placeholder="+1 555 010 1200" className={fieldClassName} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Owner name</FieldLabel>
            <input name="ownerName" placeholder="Jordan Lee" className={fieldClassName} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Owner email</FieldLabel>
            <input name="ownerEmail" type="email" placeholder="owner@business.com" className={fieldClassName} required />
          </div>
          <div className="space-y-2">
            <FieldLabel>Country</FieldLabel>
            <select
              id="create-client-country"
              name="country"
              defaultValue="United States"
              onChange={(event) => setCountry(event.target.value)}
              className={fieldClassName}
              required
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Ledger currency</FieldLabel>
            <div className="flex h-11 items-center rounded-2xl border border-outline-variant/40 bg-surface px-4 text-sm font-medium text-on-surface-variant shadow-sm">
              Auto-detected
              <span className="ml-2 text-base font-black tracking-wide text-primary">{currencyHint}</span>
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Industry</FieldLabel>
            <select name="industry" defaultValue="wholesale" className={fieldClassName} required>
              <option value="wholesale">Trading and wholesale</option>
              <option value="ecommerce">Commerce and marketplace</option>
              <option value="retail">Retail</option>
              <option value="distribution">Distribution</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="service_basic">General services</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Base package</FieldLabel>
            <select name="packageId" defaultValue="starter" className={fieldClassName} required>
              {PACKAGE_OPTIONS.map((pkg) => (
                <option key={pkg.value} value={pkg.value}>
                  {pkg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft">
        <SectionHeader
          icon="payments"
          title="Billing and access policy"
          description="Control whether the workspace is paid or demo, how it renews, and which contract model should apply."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Access mode</FieldLabel>
            <select
              name="accountMode"
              value={accountMode}
              onChange={(event) => setAccountMode(event.target.value as "paid" | "demo")}
              className={fieldClassName}
            >
              <option value="paid">Paid manual or offline</option>
              <option value="demo">Demo or free trial</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Package mode</FieldLabel>
            <select
              name="packageMode"
              value={packageMode}
              onChange={(event) => setPackageMode(event.target.value as "standard" | "custom")}
              className={fieldClassName}
            >
              <option value="standard">Use catalog package</option>
              <option value="custom">Use custom contract</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Billing cycle</FieldLabel>
            <select
              name="billingCycle"
              value={billingCycle}
              onChange={(event) => setBillingCycle(event.target.value as "MONTHLY" | "YEARLY" | "CUSTOM")}
              className={fieldClassName}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>{renewalLabel}</FieldLabel>
            <input name="renewalDate" type="date" className={fieldClassName} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Manual payment method</FieldLabel>
            <select
              name="manualPaymentMethod"
              defaultValue="BANK_TRANSFER"
              disabled={accountMode === "demo"}
              className={`${fieldClassName} disabled:opacity-50`}
            >
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="INVOICE">Invoice</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Payment reference</FieldLabel>
            <input
              name="manualPaymentReference"
              placeholder="Transfer ID, invoice number, or note"
              disabled={accountMode === "demo"}
              className={`${fieldClassName} disabled:opacity-50`}
            />
          </div>
        </div>
      </section>

      {packageMode === "custom" ? (
        <section className="animate-in slide-in-from-top-2 rounded-[28px] border border-primary/20 bg-linear-to-br from-primary/6 via-surface to-surface-container-lowest p-6 shadow-soft">
          <SectionHeader
            icon="tune"
            title="Custom package override"
            description="Apply business-specific pricing and capabilities without changing the global package catalog."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Custom package name</FieldLabel>
              <input name="customPackageName" placeholder="Enterprise regional contract" className={fieldClassName} required />
            </div>
            <div className="space-y-2">
              <FieldLabel>Custom price</FieldLabel>
              <input name="customPrice" type="number" min={0} step="0.01" placeholder="0.00" className={fieldClassName} />
            </div>
            <div className="space-y-2">
              <FieldLabel>User limit</FieldLabel>
              <input name="customUserLimit" type="number" min={1} placeholder="25" className={fieldClassName} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Feature list</FieldLabel>
              <textarea
                name="customFeatures"
                placeholder={"Dedicated onboarding\nRegional pricing\nPriority support"}
                className={textAreaClassName}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-soft">
        <SectionHeader
          icon="note_stack"
          title="Internal notes"
          description="Capture operational notes for billing, support, or handoff without affecting the tenant experience."
        />
        <div className="mt-6">
          <textarea name="adminNotes" placeholder="Internal notes, operational details, or contract context..." className={textAreaClassName} />
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-[28px] border border-outline-variant/30 bg-surface px-6 py-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">Ready to create workspace</p>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            The owner, organization, subscription defaults, and package assignment will be created together.
          </p>
        </div>
        <Button
          type="submit"
          className="h-12 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-[0.22em] text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {pending ? "Provisioning workspace..." : "Provision business"}
        </Button>
      </div>

      {state.message ? (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm font-medium shadow-soft ${
            state.success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900" : "border-rose-500/30 bg-rose-500/10 text-rose-900"
          }`}
        >
          <span className="material-symbols-outlined mt-0.5 text-[18px]">{state.success ? "check_circle" : "error"}</span>
          <div>
            {state.message}
            {state.email && <div className="mt-1 font-bold">Workspace owner: {state.email}</div>}
          </div>
        </div>
      ) : null}
    </form>
  );
}
