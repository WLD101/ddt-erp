import { getPlatformPackages } from "@/modules/packages/actions";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";

function readPackageMeta(pkg: { name: string; featureJson: string; userLimit: number }) {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(pkg.featureJson);
  } catch {
    parsed = {};
  }

  const matchingPlan = PLAN_ORDER.map((planId) => PLANS[planId]).find((plan) => plan.name.toLowerCase() === pkg.name.toLowerCase());

  return {
    branchLimit:
      typeof parsed.branchLimit === "number"
        ? parsed.branchLimit
        : matchingPlan?.limits.maxBranches ?? 0,
    integrationsLimit:
      typeof parsed.integrationsLimit === "number"
        ? parsed.integrationsLimit
        : matchingPlan?.limits.maxIntegrations ?? 0,
    monthlyInvoiceLimit:
      typeof parsed.monthlyInvoiceLimit === "number"
        ? parsed.monthlyInvoiceLimit
        : matchingPlan?.limits.maxMonthlyInvoices ?? 0,
  };
}

export default async function PlatformCatalogLimitsPage() {
  const packages = await getPlatformPackages();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Catalog limits</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Package limit reference</h1>
        <p className="text-sm text-muted-foreground">
          Review user, branch, invoice, and integration ceilings without editing the shared package catalog.
        </p>
      </section>

      <div className="grid gap-4">
        {packages.map((pkg) => {
          const meta = readPackageMeta(pkg);
          return (
            <div key={pkg.id} className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-black text-on-surface">{pkg.name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Limits used for onboarding, tenant assignment, and commercial approvals.
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  {pkg.isCustom ? "Custom-capable" : "Standard catalog"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Users</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{formatPlanLimit(pkg.userLimit)}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branches</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{formatPlanLimit(meta.branchLimit)}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Monthly invoices</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{formatPlanLimit(meta.monthlyInvoiceLimit)}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Integrations</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{formatPlanLimit(meta.integrationsLimit)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
