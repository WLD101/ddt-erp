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
    <div className="min-h-screen bg-[#0a0a12] text-on-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                Secret Admin Route
              </Badge>
              <h1 className="text-4xl font-black tracking-tight">WhatsQuery Command Center</h1>
              <p className="max-w-3xl text-sm text-on-surface-variant">
                Hidden operator surface for organization control, package assignment, manual payments, and subscription recovery.
                This route is not linked publicly and should only be used by authorized platform operators.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/platform/packages">
                <Button variant="outline" className="border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                  Package Catalog
                </Button>
              </Link>
              <Link href="/platform/exports">
                <Button variant="outline" className="border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                  Export Queue
                </Button>
              </Link>
              <Link href="/platform/leads">
                <Button variant="outline" className="border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                  Demo Leads
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
            <CardHeader>
              <CardTitle>Total Organizations</CardTitle>
              <CardDescription className="text-on-surface/60">Active and demo workspaces</CardDescription>
            </CardHeader>
            <CardContent className="text-4xl font-black">{tenants.length}</CardContent>
          </Card>
          <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
            <CardHeader>
              <CardTitle>Active Packages</CardTitle>
              <CardDescription className="text-on-surface/60">UI-manageable package catalog</CardDescription>
            </CardHeader>
            <CardContent className="text-4xl font-black">{packages.length}</CardContent>
          </Card>
          <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
            <CardHeader>
              <CardTitle>Recent Platform Events</CardTitle>
              <CardDescription className="text-on-surface/60">Last twelve platform audit entries</CardDescription>
            </CardHeader>
            <CardContent className="text-4xl font-black">{audits.length}</CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
            <CardHeader>
              <CardTitle>Create Business / Grant ERP</CardTitle>
              <CardDescription className="text-on-surface/60">
                Create paid organizations with package selection, billing cycle, offline payment metadata, and immediate dashboard access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateClientForm />
            </CardContent>
          </Card>

          <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
            <CardHeader>
              <CardTitle>Provisioning Notes</CardTitle>
              <CardDescription className="text-on-surface/60">
                Admin-created businesses are paid by default unless the account mode is switched to demo/free.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-on-surface-variant">
              <p>Countries auto-map to the existing currency rules already used in signup.</p>
              <p>Existing users are attached as the organization owner instead of being duplicated.</p>
              <p>Custom package details stay scoped to the organization instead of polluting the shared catalog.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="border-outline-variant/30 bg-surface/40 text-on-surface">
                <CardHeader className="space-y-3">
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
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <form action={updateOrganizationAdminAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Country & currency</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="country"
                          defaultValue={tenant.country || ""}
                          placeholder="Country"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="currency"
                          defaultValue={tenant.currency || ""}
                          placeholder="Currency"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                      </div>
                      <Button type="submit" className="w-full">Save locale settings</Button>
                    </form>

                    <form action={updateTenantBillingFromCommandCenterAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Billing and package</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="accountMode"
                          defaultValue={tenant.isDemoTenant ? "demo" : "paid"}
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        >
                          <option value="paid">Paid manual / offline</option>
                          <option value="demo">Demo / free</option>
                        </select>
                        <select
                          name="packageMode"
                          defaultValue={tenant.organizationPackage?.isCustomPackage ? "custom" : "standard"}
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        >
                          <option value="standard">Standard package</option>
                          <option value="custom">Custom package</option>
                        </select>
                      </div>
                      <select
                        name="packageId"
                        defaultValue={tenant.organizationPackage?.packageId || ""}
                        className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                      >
                        <option value="" disabled>Select package</option>
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
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
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
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="subscriptionStatus"
                          defaultValue={tenant.subscription?.status || "active"}
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="trialing">Trialing</option>
                          <option value="payment_pending">Payment pending</option>
                          <option value="failed">Failed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="expired">Expired</option>
                        </select>
                        <select
                          name="paymentStatus"
                          defaultValue={tenant.subscription?.paymentStatus || "paid"}
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        >
                          <option value="paid">Paid</option>
                          <option value="payment_pending">Payment pending</option>
                          <option value="failed">Failed</option>
                          <option value="demo">Demo</option>
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          name="manualPaymentMethod"
                          defaultValue={tenant.subscription?.manualPaymentMethod || "BANK_TRANSFER"}
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        >
                          <option value="BANK_TRANSFER">Bank transfer</option>
                          <option value="CASH">Cash</option>
                          <option value="INVOICE">Invoice</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <input
                          name="manualPaymentReference"
                          defaultValue={tenant.subscription?.manualPaymentReference || ""}
                          placeholder="Payment reference"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="customPackageName"
                          defaultValue={tenant.organizationPackage?.customPackageName || ""}
                          placeholder="Custom package name"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="customPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={tenant.organizationPackage?.customPrice ?? ""}
                          placeholder="Custom price"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="customUserLimit"
                          type="number"
                          min="1"
                          defaultValue={tenant.organizationPackage?.customUserLimit ?? ""}
                          placeholder="Custom users"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="customBranchLimit"
                          type="number"
                          min="1"
                          defaultValue={tenant.organizationPackage?.customBranchLimit ?? ""}
                          placeholder="Custom branches"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                      </div>
                      <textarea
                        name="customFeatures"
                        defaultValue={readCustomFeatureList(tenant.organizationPackage?.customFeatureJson)}
                        placeholder="Custom features, one per line"
                        className="min-h-24 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 py-2 text-sm text-on-surface outline-none"
                      />
                      <textarea
                        name="adminNotes"
                        defaultValue={tenant.subscription?.adminNotes || ""}
                        placeholder="Admin notes"
                        className="min-h-20 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 py-2 text-sm text-on-surface outline-none"
                      />
                      <Button type="submit" className="w-full">Save billing setup</Button>
                    </form>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <form action={setOrganizationStatusAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Access state</p>
                      <select
                        name="status"
                        defaultValue={tenant.accessStatus}
                        className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="payment_pending">Payment pending</option>
                        <option value="grace_period">Grace period</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                        <option value="expired">Expired</option>
                      </select>
                      <Button type="submit" variant="outline" className="w-full border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                        Update access
                      </Button>
                    </form>

                    <form action={extendOrganizationSubscriptionAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <input type="hidden" name="organizationId" value={tenant.id} />
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Extend subscription</p>
                      <select
                        name="days"
                        defaultValue="30"
                        className="h-10 w-full rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                      >
                        <option value="15">15 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">365 days</option>
                      </select>
                      <Button type="submit" variant="outline" className="w-full border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                        Extend period
                      </Button>
                    </form>

                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Manual payment shortcuts</p>
                      <form action={approveManualPaymentFromCommandCenterAction}>
                        <input type="hidden" name="organizationId" value={tenant.id} />
                        <Button type="submit" className="mb-3 w-full">Mark paid / convert demo</Button>
                      </form>
                      <form action={failManualPaymentFromCommandCenterAction}>
                        <input type="hidden" name="organizationId" value={tenant.id} />
                        <Button type="submit" variant="destructive" className="w-full">
                          Mark unpaid / failed
                        </Button>
                      </form>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Organization users</p>
                      {tenant.members.length === 0 ? (
                        <p className="text-sm text-on-surface/60">No users assigned.</p>
                      ) : (
                        <div className="space-y-2">
                          {tenant.members.map((member) => (
                            <div key={member.id} className="rounded-xl border border-outline-variant/30 bg-surface/30 px-3 py-2 text-sm">
                              <p className="font-bold text-on-surface">{member.user.name || member.user.email}</p>
                              <p className="text-xs text-on-surface/60">{member.user.email} - {member.role.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">Current billing snapshot</p>
                      <div className="rounded-xl border border-outline-variant/30 bg-surface/30 px-3 py-3 text-sm">
                        <p className="font-bold text-on-surface">
                          {tenant.organizationPackage?.customPackageName || tenant.organizationPackage?.package?.name || "Unassigned"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface/60">
                          {tenant.organizationPackage?.customPrice != null
                            ? formatMoney(tenant.organizationPackage.customPrice, tenant.currency || "USD")
                            : "Uses package catalog pricing"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-outline-variant/30 bg-surface/30 px-3 py-3 text-xs text-on-surface/60">
                        <p>Subscription status: <span className="text-on-surface">{tenant.subscription?.status || "active"}</span></p>
                        <p>Payment status: <span className="text-on-surface">{tenant.subscription?.paymentStatus || "payment_pending"}</span></p>
                        <p>Billing source: <span className="text-on-surface">{tenant.subscription?.billingSource || "manual"}</span></p>
                        <p>Billing cycle: <span className="text-on-surface">{formatBillingCycle(tenant.subscription?.billingCycle)}</span></p>
                        <p>Custom package: <span className="text-on-surface">{tenant.organizationPackage?.isCustomPackage ? "Yes" : "No"}</span></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
              <CardHeader>
                <CardTitle>Package controls</CardTitle>
                <CardDescription className="text-on-surface/60">
                  Edit selling limits without leaving the command center.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {packages.map((pkg) => {
                  const meta = readPackageMeta(pkg.featureJson);
                  return (
                    <form key={pkg.id} action={updatePackageFromCommandCenterAction} className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-4">
                      <input type="hidden" name="packageId" value={pkg.id} />
                      <p className="text-sm font-black text-on-surface">{pkg.name}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="monthlyPrice"
                          defaultValue={meta.monthlyPrice ?? ""}
                          placeholder="Monthly price"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="userLimit"
                          defaultValue={pkg.userLimit}
                          placeholder="Users"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="branchLimit"
                          defaultValue={meta.branchLimit ?? 1}
                          placeholder="Branches"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                        <input
                          name="integrationsLimit"
                          defaultValue={meta.integrationsLimit ?? 0}
                          placeholder="Integrations"
                          className="h-10 rounded-xl border border-outline-variant/30 bg-surface/40 px-3 text-sm text-on-surface outline-none"
                        />
                      </div>
                      <Button type="submit" variant="outline" className="w-full border-outline-variant/15 bg-transparent text-on-surface hover:bg-surface-container">
                        Save package limits
                      </Button>
                    </form>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
              <CardHeader>
                <CardTitle>Admin notes</CardTitle>
                <CardDescription className="text-on-surface/60">
                  Use this route for package assignment, offline/manual billing, subscription recovery, and demo-to-paid conversion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-on-surface-variant">
                <p>Only platform admins can create or mutate paid manual accounts.</p>
                <p>Normal users never see this route in public navigation.</p>
                <p>Customer self-serve signup and checkout flows remain separate from this admin-only workflow.</p>
              </CardContent>
            </Card>

            <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
              <CardHeader>
                <CardTitle>Demo workspace</CardTitle>
                <CardDescription className="text-on-surface/60">Current seeded demo credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-on-surface/80">
                <p><span className="font-bold text-on-surface">Organization:</span> Al Sadiq Traders</p>
                <p><span className="font-bold text-on-surface">Email:</span> admin@alsadiq.local</p>
                <p><span className="font-bold text-on-surface">Password:</span> {isProduction ? "Hidden in production" : "Demo123!"}</p>
                <p className="text-xs text-on-surface/60">
                  {isProduction
                    ? "Rotate or replace all seeded demo credentials before exposing production admins to real tenant data."
                    : <>Safe reset path for now: rerun <code className="text-on-surface">npm run seed</code>.</>}
                </p>
              </CardContent>
            </Card>

            <Card className="border-outline-variant/30 bg-surface/40 text-on-surface">
              <CardHeader>
                <CardTitle>Recent platform audit</CardTitle>
                <CardDescription className="text-on-surface/60">Latest operator actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {audits.length === 0 ? (
                  <p className="text-sm text-on-surface/60">No platform actions recorded yet.</p>
                ) : (
                  audits.map((audit) => (
                    <div key={audit.id} className="rounded-2xl border border-outline-variant/30 bg-surface/[0.03] p-3">
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface/60">{audit.action}</p>
                      <p className="mt-1 text-sm text-on-surface">{audit.entityType} - {audit.entityId}</p>
                      {audit.details ? <p className="mt-1 text-xs text-on-surface/60">{audit.details}</p> : null}
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
