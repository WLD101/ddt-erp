import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClientForm } from "./create-client-form";
import { requirePlatformAdminPage } from "@/lib/security/guards";
import {
  approveManualPaymentFromCommandCenterAction,
  extendOrganizationSubscriptionAction,
  failManualPaymentFromCommandCenterAction,
  getCommandCenterSnapshot,
  setOrganizationStatusAction,
  updatePackageFromCommandCenterAction,
  updateOrganizationAdminAction,
  updateTenantBillingFromCommandCenterAction,
} from "@/modules/command-center/actions";

export const dynamic = "force-dynamic";
const isProduction = process.env.NODE_ENV === "production";

function formatDate(value?: Date | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString();
}

function formatMoney(value?: number | null, currency = "USD") {
  if (typeof value !== "number") return "Catalog pricing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
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

export default async function CommandCenterPage() {
  await requirePlatformAdminPage();
  const { tenants, packages, audits } = await getCommandCenterSnapshot();

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface pb-12">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-surface border border-outline-variant/30 p-8 rounded-3xl shadow-soft">
          <div className="space-y-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-black tracking-widest text-[10px] uppercase px-3 py-1">
              Command Center
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
              WhatsQuery Authority
            </h1>
            <p className="max-w-2xl text-sm text-on-surface-variant font-medium">
              Global operator surface for organizational control, custom package configuration, billing overrides, and live infrastructure monitoring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/platform/packages">
              <button className="flex items-center gap-2 px-4 h-10 bg-surface border border-outline-variant text-on-surface font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Catalog
              </button>
            </Link>
            <Link href="/platform/exports">
              <button className="flex items-center gap-2 px-4 h-10 bg-surface border border-outline-variant text-on-surface font-black text-[11px] uppercase tracking-widest rounded-xl shadow-soft hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-[18px] ">cloud_download</span>
                Exports
              </button>
            </Link>
            <Link href="/platform/leads">
              <button className="flex items-center gap-2 px-5 h-10 bg-primary text-on-primary font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                Leads
              </button>
            </Link>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-3xl border-outline-variant/30 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Total Organizations</CardTitle>
              </div>
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
            </CardHeader>
            <CardContent className="text-4xl font-black text-primary tracking-tight pb-6">
              {tenants.length}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Active Packages</CardTitle>
              </div>
              <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                <span className="material-symbols-outlined text-[20px]">sell</span>
              </div>
            </CardHeader>
            <CardContent className="text-4xl font-black text-secondary tracking-tight pb-6">
              {packages.length}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Recent Events</CardTitle>
              </div>
              <div className="p-2 bg-error/10 text-error rounded-xl">
                <span className="material-symbols-outlined text-[20px]">history</span>
              </div>
            </CardHeader>
            <CardContent className="text-4xl font-black text-error tracking-tight pb-6">
              {audits.length}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-4">
              <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_business</span>
                Provision New Client
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CreateClientForm />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
            <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-4">
              <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                Provisioning Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm font-medium text-on-surface-variant">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <p>Admin-created businesses are injected as <b className="text-on-surface">PAID</b> by default unless explicitly toggled.</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <p>Smart routing automatically resolves localized currency settings based on input country.</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <p>Custom package modifications bypass public catalog enforcement, enabling unique enterprise contract override.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
                <CardHeader className="space-y-4 border-b border-outline-variant/10 bg-surface-container-lowest pb-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black">{tenant.name}</CardTitle>
                      <CardDescription className="text-on-surface/60">
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
                  <div className="grid gap-3 text-xs text-on-surface-variant sm:grid-cols-4">
                    <div>Users: <span className="font-bold text-on-surface">{tenant._count.members}</span></div>
                    <div>Branches: <span className="font-bold text-on-surface">{tenant._count.branches}</span></div>
                    <div>Products: <span className="font-bold text-on-surface">{tenant._count.products}</span></div>
                    <div>Invoices: <span className="font-bold text-on-surface">{tenant._count.salesInvoices}</span></div>
                  </div>
                  <div className="grid gap-2 text-xs text-on-surface/60 sm:grid-cols-3">
                    <div>Renewal / expiry: <span className="text-on-surface">{formatDate(tenant.organizationPackage?.customExpiryDate || tenant.subscription?.currentPeriodEnd)}</span></div>
                    <div>Payment method: <span className="text-on-surface">{tenant.subscription?.manualPaymentMethod || "Manual / Offline"}</span></div>
                    <div>Payment reference: <span className="text-on-surface">{tenant.subscription?.manualPaymentReference || "Not set"}</span></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 lg:grid-cols-2 pt-6">
                    <form action={updateOrganizationAdminAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
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

                    <form action={updateTenantBillingFromCommandCenterAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 row-span-3">
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

                    <form action={setOrganizationStatusAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
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
                    
                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
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
                  
                  <div className="mt-6 space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
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
                              <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">{member.user.email} • {member.role.name}</p>
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
            <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
              <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-4">
                <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inventory</span> Catalog Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {packages.map((pkg) => {
                  const meta = readPackageMeta(pkg.featureJson);
                  return (
                    <form key={pkg.id} action={updatePackageFromCommandCenterAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
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

            <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
              <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-4">
                <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">terminal</span> System Vault
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Demo Seed Context</p>
                  <p className="text-xs font-medium text-on-surface flex justify-between"><span>Org:</span> <span className="font-bold">Al Sadiq Traders</span></p>
                  <p className="text-xs font-medium text-on-surface flex justify-between"><span>User:</span> <span className="font-bold">admin@alsadiq.local</span></p>
                  <p className="text-xs font-medium text-on-surface flex justify-between"><span>Key:</span> <span className="font-bold text-primary">Demo123!</span></p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-outline-variant/30 overflow-hidden shadow-soft bg-surface">
              <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-4">
                <CardTitle className="text-sm font-black text-on-surface uppercase tracking-[0.1em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">receipt_long</span> Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {audits.length === 0 ? (
                  <p className="text-xs text-on-surface-variant font-medium">Clear logs.</p>
                ) : (
                  audits.slice(0, 8).map((audit) => (
                    <div key={audit.id} className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest flex gap-3">
                      <div className="w-6 h-6 rounded bg-on-surface/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">history</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">{audit.action}</p>
                        <p className="text-[10px] font-medium text-on-surface-variant">{audit.entityType}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
