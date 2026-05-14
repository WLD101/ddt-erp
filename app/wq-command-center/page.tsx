import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClientForm } from "./create-client-form";
import { requirePlatformAdminPage } from "@/lib/security/guards";
import {
  approveManualPaymentFromCommandCenterAction,
  getCommandCenterSnapshot,
  setOrganizationStatusAction,
  updatePackageFromCommandCenterAction,
  updateOrganizationAdminAction,
  updateTenantBillingFromCommandCenterAction,
} from "@/modules/command-center/actions";

export const dynamic = "force-dynamic";
const isProduction = process.env.NODE_ENV === "production";
const shellCardClassName = "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";
const panelClassName = "rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm";

function formatDate(value?: Date | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString();
}

function formatBillingCycle(value?: string | null) {
  if (!value) return "Monthly";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function readPackageMeta(featureJson: string) {
  try {
    const parsed = JSON.parse(featureJson) as Record<string, unknown>;
    return {
      monthlyPrice: typeof parsed.monthlyPrice === "number" ? parsed.monthlyPrice : null,
      branchLimit: typeof parsed.branchLimit === "number" ? parsed.branchLimit : null,
      integrationsLimit: typeof parsed.integrationsLimit === "number" ? parsed.integrationsLimit : null,
    };
  } catch {
    return {
      monthlyPrice: null,
      branchLimit: null,
      integrationsLimit: null,
    };
  }
}

function readCustomFeatureList(value?: string | null) {
  try {
    const parsed = JSON.parse(value || "{}") as { featureList?: string[] };
    return Array.isArray(parsed.featureList) ? parsed.featureList.join("\n") : "";
  } catch {
    return "";
  }
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone: "primary" | "secondary" | "error";
}) {
  const toneClassName = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    error: "bg-error/10 text-error",
  }[tone];

  return (
    <Card className={`${shellCardClassName} transition-transform duration-300 hover:-translate-y-1`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{label}</CardTitle>
        <div className={`rounded-2xl p-2 ${toneClassName}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="text-4xl font-black tracking-tight text-on-surface">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function CommandCenterPage() {
  await requirePlatformAdminPage();
  const { tenants, packages, audits, insights } = await getCommandCenterSnapshot();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                Command Center
              </Badge>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">hub</span>
                  WhatsQuery Authority
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Manage tenant provisioning, billing overrides, subscription posture, and support operations from one controlled global surface.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Live tenants</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{tenants.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Organizations under management</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Catalog plans</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{packages.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Packages available for assignment</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Recent activity</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{audits.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Newest audit events in scope</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 px-8 py-4">
            <Link href="/platform/packages">
              <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Package catalog
              </Button>
            </Link>
            <Link href="/platform/exports">
              <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                Export queue
              </Button>
            </Link>
            <Link href="/platform/leads">
              <Button className="h-10 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                Demo leads
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <MetricCard icon="apartment" label="Total organizations" value={tenants.length} tone="primary" />
          <MetricCard icon="payments" label="Money collected" value={`Rs. ${insights.collectedRevenue.toLocaleString()}`} tone="secondary" />
          <MetricCard icon="history" label="Demo activation ratio" value={`${insights.demoRegistrationRatio}%`} tone="error" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr,1fr,1fr]">
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
                Growth intelligence
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                High-level signals for conversions, customer footprint, and custom deployment demand.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pb-6 pt-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">ERPs onboarded</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{insights.erpsOnboarded}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Paid and live workspaces currently under management.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Custom ERP requests</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{insights.customRequests}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Enterprise pending and custom package requests needing follow-up.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Demo registrations</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{insights.demoLeadCount}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">{insights.activatedDemoCount} converted into approved demo workspaces.</p>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Recent platform events</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{audits.length}</p>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Latest audited actions across command center operations.</p>
              </div>
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">language</span>
                Country breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 pt-6">
              {insights.countryBreakdown.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No country data captured yet.</p>
              ) : (
                insights.countryBreakdown.map((entry) => (
                  <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                    <span className="text-sm font-bold text-on-surface">{entry.label}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-primary">{entry.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">category</span>
                Business types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 pt-6">
              {insights.businessTypeBreakdown.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No industry data captured yet.</p>
              ) : (
                insights.businessTypeBreakdown.map((entry) => (
                  <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                    <span className="text-sm font-bold text-on-surface">{entry.label}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-secondary">{entry.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_business</span>
                Provision new client
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                Create a new business account, assign subscription controls, and grant immediate access without leaving the command center.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-6">
              <CreateClientForm />
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                Provisioning protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-6 text-sm font-medium text-on-surface-variant">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p>Admin-created businesses default to <b className="text-on-surface">paid active access</b> unless explicitly created as demo.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p>Country selection drives the default ledger currency and keeps new tenant setup consistent.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <p>Custom package overrides stay tenant-specific and do not mutate the shared package catalog.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className={shellCardClassName}>
                <CardHeader className="space-y-5 border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-6 pb-6 pt-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-black tracking-tight">{tenant.name}</CardTitle>
                      <CardDescription className="text-sm font-medium text-on-surface/60">
                        /{tenant.slug} - {tenant.country || "Country not set"} - {tenant.currency}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-outline-variant/30 text-on-surface/80">
                        {tenant.organizationPackage?.customPackageName || tenant.organizationPackage?.package?.name || tenant.subscription?.planId || "Unassigned"}
                      </Badge>
                      <Badge variant="outline" className="border-outline-variant/30 text-on-surface/80">
                        {formatBillingCycle(tenant.subscription?.billingCycle)}
                      </Badge>
                      <Badge variant="outline" className="border-outline-variant/30 text-on-surface/80">
                        {tenant.subscription?.paymentStatus || "payment_pending"}
                      </Badge>
                      <Badge variant="outline" className="border-outline-variant/30 text-on-surface/80">
                        {tenant.subscription?.billingSource || "manual"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          tenant.accessStatus === "active"
                            ? "border-emerald-500/30 text-emerald-400"
                            : tenant.accessStatus === "grace_period"
                              ? "border-amber-500/30 text-amber-300"
                              : "border-rose-500/30 text-rose-400"
                        }
                      >
                        {tenant.accessStatus}
                      </Badge>
                      {tenant.isDemoTenant ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          Demo
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-xs text-on-surface-variant">
                      Users
                      <div className="mt-2 text-2xl font-black text-on-surface">{tenant._count.members}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-xs text-on-surface-variant">
                      Branches
                      <div className="mt-2 text-2xl font-black text-on-surface">{tenant._count.branches}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-xs text-on-surface-variant">
                      Products
                      <div className="mt-2 text-2xl font-black text-on-surface">{tenant._count.products}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-xs text-on-surface-variant">
                      Invoices
                      <div className="mt-2 text-2xl font-black text-on-surface">{tenant._count.salesInvoices}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Renewal / expiry
                      <div className="mt-1 text-sm font-bold text-on-surface">{formatDate(tenant.organizationPackage?.customExpiryDate || tenant.subscription?.currentPeriodEnd)}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Payment method
                      <div className="mt-1 text-sm font-bold text-on-surface">{tenant.subscription?.manualPaymentMethod || "Manual / Offline"}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Payment reference
                      <div className="mt-1 text-sm font-bold text-on-surface">{tenant.subscription?.manualPaymentReference || "Not set"}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Stripe customer
                      <div className="mt-1 truncate text-sm font-bold text-on-surface">{tenant.subscription?.stripeCustomerId || "Not linked"}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Stripe subscription
                      <div className="mt-1 truncate text-sm font-bold text-on-surface">{tenant.subscription?.stripeSubscriptionId || "Not linked"}</div>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-3 text-on-surface/65">
                      Stripe price
                      <div className="mt-1 truncate text-sm font-bold text-on-surface">{tenant.subscription?.stripePriceId || "Not linked"}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid gap-4 pt-6 lg:grid-cols-2">
                    <form action={updateOrganizationAdminAction} className={`space-y-3 ${panelClassName}`}>
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">language</span> Locale Controls
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="country"
                          defaultValue={tenant.country || ""}
                          placeholder="Country"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                        />
                        <input
                          name="currency"
                          defaultValue={tenant.currency || ""}
                          placeholder="Currency"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                        />
                      </div>
                      <button type="submit" className="w-full h-10 flex items-center justify-center bg-surface border border-outline-variant text-on-surface font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-surface-container-low transition-all">
                        Save Localisation
                      </button>
                    </form>

                    <form action={updateTenantBillingFromCommandCenterAction} className={`row-span-3 space-y-3 ${panelClassName}`}>
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">payments</span> Billing & Overrides
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="accountMode"
                          defaultValue={tenant.isDemoTenant ? "demo" : "paid"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="paid">Paid Manual</option>
                          <option value="demo">Demo Mode</option>
                        </select>
                        <select
                          name="packageMode"
                          defaultValue={tenant.organizationPackage?.isCustomPackage ? "custom" : "standard"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="standard">Standard Catalog</option>
                          <option value="custom">Custom Override</option>
                        </select>
                      </div>
                      <select
                        name="packageId"
                        defaultValue={tenant.organizationPackage?.packageId || ""}
                        className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                      >
                        <option value="" disabled>Select core package</option>
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </option>
                        ))}
                      </select>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="billingCycle"
                          defaultValue={tenant.subscription?.billingCycle || tenant.organizationPackage?.customBillingCycle || "MONTHLY"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                        <input
                          name="renewalDate"
                          type="date"
                          defaultValue={
                            tenant.organizationPackage?.customExpiryDate || tenant.subscription?.currentPeriodEnd
                              ? new Date(tenant.organizationPackage?.customExpiryDate || tenant.subscription?.currentPeriodEnd || "").toISOString().slice(0, 10)
                              : ""
                          }
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="subscriptionStatus"
                          defaultValue={tenant.subscription?.status || "active"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="active">Active</option>
                          <option value="trialing">Trialing</option>
                          <option value="payment_pending">Pending</option>
                          <option value="failed">Failed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="expired">Expired</option>
                        </select>
                        <select
                          name="paymentStatus"
                          defaultValue={tenant.subscription?.paymentStatus || "paid"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="paid">Paid</option>
                          <option value="payment_pending">Pending</option>
                          <option value="failed">Failed</option>
                          <option value="demo">Demo</option>
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="manualPaymentMethod"
                          defaultValue={tenant.subscription?.manualPaymentMethod || "BANK_TRANSFER"}
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="BANK_TRANSFER">Bank Wire</option>
                          <option value="CASH">Cash Box</option>
                          <option value="INVOICE">Invoice Net</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <input
                          name="manualPaymentReference"
                          defaultValue={tenant.subscription?.manualPaymentReference || ""}
                          placeholder="Ref Code"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 border-t border-outline-variant/20 pt-3 mt-1">
                        <input
                          name="customPackageName"
                          defaultValue={tenant.organizationPackage?.customPackageName || ""}
                          placeholder="Override Plan Name"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium col-span-2"
                        />
                        <input
                          name="customPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={tenant.organizationPackage?.customPrice ?? ""}
                          placeholder="Override Price"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        />
                        <input
                          name="customUserLimit"
                          type="number"
                          min="1"
                          defaultValue={tenant.organizationPackage?.customUserLimit ?? ""}
                          placeholder="User limit"
                          className="h-11 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        />
                      </div>
                      <textarea
                        name="customFeatures"
                        defaultValue={readCustomFeatureList(tenant.organizationPackage?.customFeatureJson)}
                        placeholder="Enterprise features (One per line)"
                        className="min-h-20 w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-3 text-sm text-on-surface outline-none font-medium resize-none"
                      />
                      <button type="submit" className="w-full h-11 bg-primary text-on-primary font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        Save Configuration
                      </button>
                    </form>

                    <form action={setOrganizationStatusAction} className={`space-y-3 ${panelClassName}`}>
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">lock</span> Access Locking
                      </p>
                      <div className="flex gap-2">
                        <select
                          name="status"
                          defaultValue={tenant.accessStatus}
                          className="h-11 flex-1 rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                        >
                          <option value="active">ACTIVE</option>
                          <option value="payment_pending">PENDING</option>
                          <option value="grace_period">GRACE</option>
                          <option value="suspended">SUSPENDED</option>
                          <option value="blocked">BLOCKED</option>
                          <option value="expired">EXPIRED</option>
                        </select>
                        <button type="submit" className="h-11 px-4 bg-error/10 border border-error/20 text-error font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-error/20 transition-all">
                          Apply
                        </button>
                      </div>
                    </form>
                    
                    <div className={`space-y-3 ${panelClassName}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">bolt</span> Actions
                      </p>
                      <div className="grid gap-2">
                        <form action={approveManualPaymentFromCommandCenterAction} className="w-full">
                          <input type="hidden" name="organizationId" value={tenant.id} />
                          <button type="submit" className="w-full h-11 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 hover:opacity-90 transition-all">
                            Verify Paid Access
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`mt-6 space-y-3 ${panelClassName}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">group</span> Organization Members
                    </p>
                    {tenant.members.length === 0 ? (
                      <p className="text-xs text-on-surface-variant font-medium">No administrators mapped to this workspace.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tenant.members.map((member) => (
                          <div key={member.id} className="rounded-xl border border-outline-variant/50 bg-surface px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                              {member.user.name ? member.user.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="text-sm font-black text-on-surface">{member.user.name || "Unnamed User"}</p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{member.user.email} - {member.role.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inventory</span> Catalog Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6 pt-6">
                {packages.map((pkg) => {
                  const meta = readPackageMeta(pkg.featureJson);
                  return (
                    <form key={pkg.id} action={updatePackageFromCommandCenterAction} className="space-y-3 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                      <input type="hidden" name="packageId" value={pkg.id} />
                      <p className="text-xs font-black text-on-surface uppercase tracking-widest">{pkg.name}</p>
                      <div className="grid gap-3 grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase">Monthly Rate</label>
                          <input
                            name="monthlyPrice"
                            defaultValue={meta.monthlyPrice ?? ""}
                            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase">Users</label>
                          <input
                            name="userLimit"
                            defaultValue={pkg.userLimit}
                            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium"
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full h-9 flex items-center justify-center bg-surface border border-outline-variant text-on-surface font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-surface-container-low transition-all">
                        Update Global Pricing
                      </button>
                    </form>
                  );
                })}
              </CardContent>
            </Card>

            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">terminal</span> System Vault
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 pt-6">
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Credential posture</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">Masked integration metadata only</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-on-surface-variant">
                    Secrets stay hidden. Use the dedicated vault page to inspect provider status, owner workspace, and last sync state.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Production posture</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{isProduction ? "Live production mode" : "Non-production environment"}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-on-surface-variant">
                    Use this panel for controlled support context only. Tenant-facing workflows remain unchanged.
                  </p>
                </div>
                <Link
                  href="/platform/vault"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface text-[11px] font-black uppercase tracking-[0.18em] text-on-surface shadow-soft transition-colors hover:bg-surface-container-low"
                >
                  Open System Vault
                </Link>
              </CardContent>
            </Card>

            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">receipt_long</span> Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 pt-6">
                {audits.length === 0 ? (
                  <p className="text-xs text-on-surface-variant font-medium">Clear logs.</p>
                ) : (
                  audits.slice(0, 8).map((audit) => (
                    <div key={audit.id} className="flex gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-on-surface/5">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">history</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">{audit.action}</p>
                        <p className="text-[10px] font-medium text-on-surface-variant">{audit.entityType}</p>
                      </div>
                    </div>
                  ))
                )}
                <Link
                  href="/platform/audit-log"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface text-[11px] font-black uppercase tracking-[0.18em] text-on-surface shadow-soft transition-colors hover:bg-surface-container-low"
                >
                  View Full Audit Log
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
