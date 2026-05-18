import { PackageOpen } from "lucide-react";
import { getPlatformPackages } from "@/modules/packages/actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeactivatePackageButton, PackageAdminClient } from "./PackageAdminClient";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

function readPackageMeta(pkg: { name: string; featureJson: string; userLimit: number; businessSize: string | null }) {
  let parsed: Record<string, unknown> = {};

  try {
    parsed = JSON.parse(pkg.featureJson);
  } catch {
    parsed = {};
  }

  const matchingPlan = PLAN_ORDER.map((planId) => PLANS[planId]).find((plan) => plan.name.toLowerCase() === pkg.name.toLowerCase());

  return {
    price: typeof parsed.displayPrice === "string" ? parsed.displayPrice : matchingPlan ? `${matchingPlan.price.display}${matchingPlan.price.cadence}` : "Custom",
    annualPrice:
      typeof parsed.yearlyPrice === "number"
        ? `PKR ${parsed.yearlyPrice.toLocaleString()}/year`
        : matchingPlan?.price.yearly
          ? `PKR ${matchingPlan.price.yearly.toLocaleString()}/year`
          : "Custom",
    branchLimit:
      typeof parsed.branchLimit === "number"
        ? parsed.branchLimit
        : matchingPlan
          ? matchingPlan.limits.maxBranches
          : 0,
    customerLimit:
      typeof parsed.customerLimit === "number"
        ? parsed.customerLimit
        : matchingPlan?.limits.maxCustomers ?? 0,
    modules: Array.isArray(parsed.modules)
      ? parsed.modules.filter((item): item is string => typeof item === "string")
      : matchingPlan?.includedModules || [],
    supportLabel:
      typeof parsed.supportLabel === "string"
        ? parsed.supportLabel
        : matchingPlan?.supportLabel || "Custom support",
    audience: pkg.businessSize || matchingPlan?.audience || "Custom package",
    isRecommended: Boolean(matchingPlan),
  };
}

export default async function PlatformPackagesPage() {
  const packages = await getPlatformPackages();
  const recommendedPlans = PLAN_ORDER.map((planId) => PLANS[planId]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <PackageOpen className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Package operations</p>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Workspace pricing packages</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Keep the public pricing story, internal package setup, and tenant assignment logic aligned for demos and rollout planning.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {recommendedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl border p-6 ${
              plan.highlight ? "border-primary/40 bg-primary/[0.06] shadow-xl shadow-primary/10" : "border-outline-variant/30 bg-surface/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-on-surface">{plan.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
              </div>
              {plan.highlight ? (
                <Badge variant="outline" className="border-primary/40 text-primary">
                  Recommended
                </Badge>
              ) : null}
            </div>
            <div className="mt-5">
              <p className="text-3xl font-black text-on-surface">{plan.price.display}</p>
              {plan.price.cadence ? <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{plan.price.cadence}</p> : null}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-outline-variant/20 bg-surface/[0.02] p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branches</p>
                <p className="mt-1 text-lg font-black text-on-surface">{formatPlanLimit(plan.limits.maxBranches)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Users</p>
                <p className="mt-1 text-lg font-black text-on-surface">{formatPlanLimit(plan.limits.maxUsers)}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {plan.includedModules.slice(0, 4).map((module) => (
                <p key={module} className="text-sm text-on-surface/75">
                  {module}
                </p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <PackageAdminClient />

      <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface/40">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead>Package</TableHead>
              <TableHead>Monthly price</TableHead>
              <TableHead>Annual price</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Highlights</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => {
              const meta = readPackageMeta(pkg);

              return (
                <TableRow key={pkg.id} className="border-outline-variant/30">
                  <TableCell>
                    <div>
                      <p className="font-bold text-on-surface">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.audience}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-on-surface/80">{meta.price}</TableCell>
                  <TableCell className="font-medium text-on-surface/80">{meta.annualPrice}</TableCell>
                  <TableCell>{meta.branchLimit ? formatPlanLimit(meta.branchLimit) : "Custom"}</TableCell>
                  <TableCell>{formatPlanLimit(pkg.userLimit)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {meta.modules.slice(0, 3).map((module) => (
                        <Badge key={module} variant="outline" className="border-outline-variant/30 text-on-surface-variant">
                          {module}
                        </Badge>
                      ))}
                      {meta.modules.length > 3 ? (
                        <Badge variant="outline" className="border-outline-variant/30 text-on-surface-variant/50">
                          +{meta.modules.length - 3} more
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pkg.isActive ? "border-emerald-500/30 text-emerald-400" : "border-rose-500/30 text-rose-400"}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {pkg.isCustom ? (
                      <Badge variant="outline" className="ml-2 border-primary/30 text-primary">
                        Custom
                      </Badge>
                    ) : meta.isRecommended ? (
                      <Badge variant="outline" className="ml-2 border-outline-variant/30 text-on-surface/60">
                        Standard
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{pkg._count.assignments}</TableCell>
                  <TableCell className="text-right">{pkg.isActive ? <DeactivatePackageButton id={pkg.id} /> : null}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

