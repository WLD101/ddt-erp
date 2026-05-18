import { StripeCheckoutLauncher } from "@/components/billing/stripe-checkout-launcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { PLAN_ORDER, PLANS, formatPlanLimit, normalizePlanId } from "@/lib/billing/plans";
import { getTenantUsageAnalytics } from "@/lib/monitoring/tenant-usage";
import { getAvailableStripeBillingCycles } from "@/lib/billing/stripe";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { cn } from "@/lib/utils";

export default async function BillingSettingsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const subCtx = await getSubscriptionContext(ctx.organizationId);
  const tenantUsage = await getTenantUsageAnalytics(ctx.organizationId);
  const {
    plan,
    status,
    daysRemaining,
    usage,
    packageName,
    billingCycle,
    billingSource,
    paymentStatus,
    renewalDate,
    manualPaymentMethod,
    manualPaymentReference,
    isCustomPackage,
    featureList,
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId,
    cancelAtPeriodEnd,
  } = subCtx;

  const isTrial = status === "trialing";
  const isExpired = status === "expired";
  const isGrace = status === "grace_period";
  const normalizedPlanId = normalizePlanId(subCtx.sub?.planId || subCtx.plan.id);
  const canUseStripeCheckout = Boolean(normalizedPlanId && normalizedPlanId !== "enterprise" && !isCustomPackage);
  const availableCycles = normalizedPlanId ? getAvailableStripeBillingCycles(normalizedPlanId) : { monthly: false, yearly: false };
  const canUsePortal = Boolean(stripeCustomerId && stripeSubscriptionId && billingSource === "stripe");

  const usageStats = [
    { name: "Users", current: usage.users, limit: plan.limits.maxUsers, icon: "group" },
    { name: "Branches", current: usage.branches, limit: plan.limits.maxBranches, icon: "location_on" },
    { name: "Customers", current: usage.customers, limit: plan.limits.maxCustomers, icon: "contacts" },
    { name: "Products", current: usage.products, limit: plan.limits.maxProducts, icon: "inventory_2" },
    { name: "Monthly invoices", current: usage.monthlyInvoices, limit: plan.limits.maxMonthlyInvoices, icon: "receipt_long" },
    { name: "Monthly purchases", current: usage.monthlyPurchases, limit: plan.limits.maxMonthlyPurchases, icon: "shopping_bag" },
    { name: "Exports today", current: usage.exportsToday, limit: plan.limits.maxDailyExports, icon: "ios_share" },
    { name: "Assistant this month", current: usage.assistantActionsThisMonth, limit: plan.limits.maxMonthlyAssistantActions, icon: "auto_awesome" },
  ];

  const activityStats = [
    { name: "Customers", value: tenantUsage.counts.customers, icon: "contacts" },
    { name: "Suppliers", value: tenantUsage.counts.suppliers, icon: "local_shipping" },
    { name: "Products", value: tenantUsage.counts.products, icon: "inventory_2" },
    { name: "Users", value: tenantUsage.counts.users, icon: "group" },
    { name: "Branches", value: tenantUsage.counts.branches, icon: "location_on" },
    { name: "Invoices this month", value: tenantUsage.monthlyActivity.invoicesThisMonth, icon: "receipt_long" },
    { name: "Purchases this month", value: tenantUsage.monthlyActivity.purchasesThisMonth, icon: "shopping_bag" },
    { name: "Exports this month", value: tenantUsage.monthlyActivity.exportsThisMonth, icon: "ios_share" },
    { name: "Reports this month", value: tenantUsage.monthlyActivity.reportActionsThisMonth, icon: "analytics" },
    { name: "Assistant actions", value: tenantUsage.monthlyActivity.assistantActionsThisMonth, icon: "smart_toy" },
  ];

  const usageSignalStats = [
    { label: "Products", current: usage.products, limit: plan.limits.maxProducts },
    { label: "Customers", current: usage.customers, limit: plan.limits.maxCustomers },
    { label: "Users", current: usage.users, limit: plan.limits.maxUsers },
    { label: "Branches", current: usage.branches, limit: plan.limits.maxBranches },
    { label: "Invoices / month", current: usage.monthlyInvoices, limit: plan.limits.maxMonthlyInvoices },
    { label: "Assistant / month", current: usage.assistantActionsThisMonth, limit: plan.limits.maxMonthlyAssistantActions },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
          Subscription <span className="text-primary">Architecture</span>
        </h2>
        <p className="mt-1 text-sm font-medium text-on-surface-variant font-body-md">
          Manage workspace quotas, Stripe billing, subscription posture, and renewal timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <Card className="col-span-1 overflow-hidden rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">credit_card</span>
              Active Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-1">
              <h2 className="font-headline-lg text-3xl font-black tracking-tighter text-on-surface">{packageName}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">System Tier</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Subscription status</span>
                <span className="font-black uppercase text-on-surface">{status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment status</span>
                <span className="font-black uppercase text-on-surface">{paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Billing source</span>
                <span className="font-black uppercase text-on-surface">{billingSource}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Billing cycle</span>
                <span className="font-black uppercase text-on-surface">{billingCycle}</span>
              </div>
              {plan.price.yearly ? (
                <div className="flex items-center justify-between">
                  <span>Annual offer</span>
                  <span className="font-black text-on-surface">
                    {plan.price.promoEnabled ? `${plan.price.yearly.toLocaleString()} / year` : "Not active"}
                  </span>
                </div>
              ) : null}
              {plan.price.savingsPercent ? (
                <div className="flex items-center justify-between">
                  <span>Annual savings</span>
                  <span className="font-black uppercase text-emerald-600">Save {plan.price.savingsPercent}%</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Renewal / expiry</span>
                <span className="font-black text-on-surface">{renewalDate ? new Date(renewalDate).toLocaleDateString() : "Not scheduled"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment method</span>
                <span className="font-black text-on-surface">{manualPaymentMethod || (billingSource === "stripe" ? "Stripe subscription" : "Manual / Offline Payment")}</span>
              </div>
              {manualPaymentReference ? (
                <div className="flex items-center justify-between gap-4">
                  <span>Reference</span>
                  <span className="font-black text-on-surface">{manualPaymentReference}</span>
                </div>
              ) : null}
              {stripePriceId ? (
                <div className="flex items-center justify-between gap-4">
                  <span>Stripe price</span>
                  <span className="truncate font-black text-on-surface">{stripePriceId}</span>
                </div>
              ) : null}
              {stripeSubscriptionId ? (
                <div className="flex items-center justify-between gap-4">
                  <span>Subscription ID</span>
                  <span className="truncate font-black text-on-surface">{stripeSubscriptionId}</span>
                </div>
              ) : null}
            </div>

            {isTrial ? (
              <div className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <span className="material-symbols-outlined mt-0.5 text-[24px] text-amber-600">schedule</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">Trial Context</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-on-surface-variant">
                    Utilization window expires in <span className="font-black text-on-surface">{daysRemaining} days</span>.
                  </p>
                </div>
              </div>
            ) : null}

            {isGrace ? (
              <div className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <span className="material-symbols-outlined mt-0.5 text-[24px] text-amber-600">warning</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">Grace period</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-on-surface-variant">
                    Payment needs attention. Access stays active temporarily while you update billing.
                  </p>
                </div>
              </div>
            ) : null}

            {isExpired ? (
              <div className="flex items-start gap-4 rounded-2xl border border-error/20 bg-error/5 p-5">
                <span className="material-symbols-outlined mt-0.5 text-[24px] text-error">report_problem</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-error">Protocol Expired</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-on-surface-variant">
                    Workspace access is restricted until a valid subscription becomes active again.
                  </p>
                </div>
              </div>
            ) : null}

            {cancelAtPeriodEnd ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold uppercase tracking-widest text-amber-100">
                Cancellation is scheduled at the end of the current billing period.
              </div>
            ) : null}

            {isCustomPackage && featureList.length > 0 ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary">Custom package features</p>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{featureList.join(", ")}</p>
              </div>
            ) : null}

            {plan.price.promoEnabled && plan.price.promoLabel ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Online annual payment special</p>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  {plan.price.promoLabel}
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="pb-8">
            <div className="w-full space-y-3">
              {canUsePortal ? (
                <form action="/api/billing/portal" method="post">
                  <Button type="submit" className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    Open Stripe Billing Portal
                  </Button>
                </form>
              ) : canUseStripeCheckout && normalizedPlanId ? (
                <StripeCheckoutLauncher
                  compact
                  planId={normalizedPlanId}
                  planName={plan.name}
                  initialBillingCycle={billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY"}
                  availableCycles={availableCycles}
                />
              ) : (
                <Button disabled className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  Contact admin for billing changes
                </Button>
              )}
              <p className="text-center text-[11px] text-on-surface-variant">
                {canUsePortal
                  ? "Manage card details, cancellation, and invoices inside Stripe Customer Portal."
                  : canUseStripeCheckout
                    ? "Use secure Stripe checkout to activate or update this workspace plan."
                    : "Enterprise and custom packages continue through platform-admin approval."}
              </p>
            </div>
          </CardFooter>
        </Card>

        <Card className="col-span-1 rounded-3xl border-outline-variant/30 bg-surface shadow-soft lg:col-span-2">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">System Utilization</CardTitle>
            <CardDescription className="mt-1 text-xs font-medium text-on-surface-variant">
              Operational telemetry against {plan.name} limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
              {usageStats.map((stat) => {
                const percent = Math.min(100, Math.round((stat.current / stat.limit) * 100));
                const isWarning = percent >= 80;
                const isCritical = percent >= 100;
                return (
                  <div key={stat.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">{stat.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.name}</span>
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-on-surface-variant/60">
                        <span className={cn("text-on-surface", isWarning && "text-amber-600", isCritical && "text-error")}>
                          {stat.current}
                        </span>{" "}
                        / {formatPlanLimit(stat.limit)}
                      </span>
                    </div>
                    {stat.limit < 900000 ? (
                      <Progress
                        value={percent}
                        className="h-2 bg-surface-container-low"
                        indicatorClassName={cn("bg-primary", isWarning && "bg-amber-500", isCritical && "bg-error")}
                      />
                    ) : (
                      <Progress value={0} className="h-2 bg-surface-container-low" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Storage metering</p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    Per-tenant storage usage will appear here once file uploads are fully metered across local and object storage.
                  </p>
                </div>
                <span className="rounded-full border border-outline-variant/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {plan.limits.maxStorageGb ? `${plan.limits.maxStorageGb} GB cap` : "Dedicated review"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Tenant Activity Analytics
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-medium text-on-surface-variant">
              Workspace-only operational usage. Platform health remains restricted to the command center.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 xl:grid-cols-3">
            {activityStats.map((stat) => (
              <div
                key={stat.name}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">{stat.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {stat.name}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-on-surface">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Upgrade Signals
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-medium text-on-surface-variant">
              Early-warning telemetry for tenant admins before hard plan blocks apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-8">
            {usageSignalStats.map((stat) => {
              const percent = Math.min(100, Math.round((stat.current / stat.limit) * 100));
              const toneClassName =
                percent >= 100 ? "text-error" : percent >= 80 ? "text-amber-600" : "text-emerald-600";

              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      {stat.label}
                    </span>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest", toneClassName)}>
                      {percent}%
                    </span>
                  </div>
                  <Progress
                    value={percent}
                    className="h-2 bg-surface-container-low"
                    indicatorClassName={cn("bg-emerald-600", percent >= 80 && "bg-amber-500", percent >= 100 && "bg-error")}
                  />
                  <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant">
                    <span>{stat.current.toLocaleString()} used</span>
                    <span>{formatPlanLimit(stat.limit)} available</span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-primary">Usage policy</p>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                At 80% usage, your team should plan an upgrade. At 100%, protected creation and execution flows will block with an upgrade prompt.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-10">
        <h3 className="mb-8 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-primary">architecture</span>
          Plan Comparison Matrix
        </h3>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const p = PLANS[planId];
            const isCurrent = p.id === plan.id || p.name === plan.name;
            const canSelfServeThisPlan = p.id !== "enterprise";

            return (
              <Card
                key={p.id}
                className={cn(
                  "relative overflow-hidden rounded-3xl border bg-surface shadow-soft transition-all duration-500",
                  isCurrent ? "border-primary bg-primary/[0.02] shadow-xl shadow-primary/5" : "border-outline-variant/30",
                )}
              >
                {isCurrent ? <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" /> : null}
                <CardHeader className="pb-6">
                  <CardTitle className="font-headline-sm text-xl font-black tracking-tight text-on-surface">{p.name}</CardTitle>
                  <CardDescription className="text-xs font-black uppercase tracking-widest text-primary">
                    {p.price.display}
                    {p.price.cadence ? ` ${p.price.cadence}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <p className="border-b border-outline-variant/10 pb-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Operational Quotas
                    </p>
                    <div className="space-y-2 text-[11px] font-bold text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>User Seats</span>
                        <span className="font-black text-on-surface">{formatPlanLimit(p.limits.maxUsers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Branch Nodes</span>
                        <span className="font-black text-on-surface">{formatPlanLimit(p.limits.maxBranches)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SKU Repository</span>
                        <span className="font-black text-on-surface">{formatPlanLimit(p.limits.maxProducts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customers</span>
                        <span className="font-black text-on-surface">{formatPlanLimit(p.limits.maxCustomers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exports / day</span>
                        <span className="font-black text-on-surface">{formatPlanLimit(p.limits.maxDailyExports)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="border-b border-outline-variant/10 pb-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Capability Matrix
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Advanced Analytics", enabled: p.features.advancedReports, icon: "analytics" },
                        { label: "Data Export Nodes", enabled: p.features.exportData, icon: "ios_share" },
                        { label: "Bulk Manifest Import", enabled: p.features.csvImport, icon: "upload_file" },
                        {
                          label: "Ecommerce Integration",
                          enabled: p.features.darazIntegration || p.features.shopifyIntegration || p.features.woocommerceIntegration,
                          icon: "hub",
                        },
                      ].map((feat) => (
                        <div key={feat.label} className="flex items-center gap-3 text-[11px] font-bold">
                          <span className={cn("material-symbols-outlined text-[18px]", feat.enabled ? "text-primary" : "text-on-surface-variant/20")}>
                            {feat.enabled ? "check_circle" : "cancel"}
                          </span>
                          <span className={cn(feat.enabled ? "text-on-surface" : "text-on-surface-variant/40")}>{feat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-8">
                  {isCurrent ? (
                    <Button variant="outline" className="h-11 w-full rounded-xl text-[10px] font-black uppercase tracking-widest" disabled>
                      Current Protocol
                    </Button>
                  ) : canUsePortal ? (
                    <form action="/api/billing/portal" method="post" className="w-full">
                      <Button type="submit" variant="outline" className="h-11 w-full rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Manage In Portal
                      </Button>
                    </form>
                  ) : canSelfServeThisPlan ? (
                    <StripeCheckoutLauncher
                      compact
                      planId={p.id}
                      planName={p.name}
                      initialBillingCycle={billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY"}
                      availableCycles={getAvailableStripeBillingCycles(p.id)}
                    />
                  ) : (
                    <Button variant="outline" className="h-11 w-full rounded-xl text-[10px] font-black uppercase tracking-widest" disabled>
                      Contact Sales
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
