import { getCurrentTenantContext } from "@/lib/tenant";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { PLAN_ORDER, PLANS, formatPlanLimit } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default async function BillingSettingsPage() {
  const ctx = await getCurrentTenantContext();
  const subCtx = await getSubscriptionContext(ctx.organizationId);
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
  } = subCtx;
  const branchCount = await prisma.branch.count({
    where: { organizationId: ctx.organizationId },
  });

  const isTrial = status === "trialing";
  const isExpired = status === "expired";
  
  const usageStats = [
    { name: "Users", current: usage.users, limit: plan.limits.maxUsers, icon: "group" },
    { name: "Branches", current: branchCount, limit: plan.limits.maxBranches, icon: "location_on" },
    { name: "Products", current: usage.products, limit: plan.limits.maxProducts, icon: "inventory_2" },
    { name: "Monthly Sales", current: usage.monthlyInvoices, limit: plan.limits.maxMonthlyInvoices, icon: "receipt_long" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
          Subscription <span className="text-primary">Architecture</span>
        </h2>
        <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
          Manage workspace quotas, system utilization, and organizational scaling protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="col-span-1 rounded-3xl shadow-soft border-outline-variant/30 overflow-hidden bg-surface">
          <CardHeader className="bg-surface-container-lowest border-b border-outline-variant/10 pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">credit_card</span> Active Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-on-surface font-headline-lg">{packageName}</h2>
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
              <div className="flex items-center justify-between">
                <span>Renewal / expiry</span>
                <span className="font-black text-on-surface">{renewalDate ? new Date(renewalDate).toLocaleDateString() : "Not scheduled"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment method</span>
                <span className="font-black text-on-surface">{manualPaymentMethod || "Manual / Offline Payment"}</span>
              </div>
              {manualPaymentReference ? (
                <div className="flex items-center justify-between">
                  <span>Reference</span>
                  <span className="font-black text-on-surface">{manualPaymentReference}</span>
                </div>
              ) : null}
            </div>
            
            {isTrial && (
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <span className="material-symbols-outlined text-amber-600 text-[24px] mt-0.5">schedule</span>
                <div>
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Trial Context</p>
                  <p className="text-xs font-medium text-on-surface-variant mt-1.5 leading-relaxed">
                    Utilization window expires in <span className="text-on-surface font-black">{daysRemaining} cycles</span>.
                  </p>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-error/20 bg-error/5">
                <span className="material-symbols-outlined text-error text-[24px] mt-0.5">report_problem</span>
                <div>
                  <p className="text-[11px] font-black text-error uppercase tracking-widest">Protocol Expired</p>
                  <p className="text-xs font-medium text-on-surface-variant mt-1.5 leading-relaxed">
                    Workspace is currently locked to read-only telemetry.
                  </p>
                </div>
              </div>
            )}

            {isCustomPackage && featureList.length > 0 ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary">Custom package features</p>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  {featureList.join(", ")}
                </p>
              </div>
            ) : null}

          </CardContent>
          <CardFooter className="pb-8">
            <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              Manage Billing Node
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 lg:col-span-2 rounded-3xl shadow-soft border-outline-variant/30 bg-surface">
          <CardHeader className="bg-surface-container-lowest border-b border-outline-variant/10 pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">System Utilization</CardTitle>
            <CardDescription className="text-xs font-medium text-on-surface-variant mt-1">Operational telemetry against {plan.name} limits.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {usageStats.map((stat) => {
                const percent = Math.min(100, Math.round((stat.current / stat.limit) * 100));
                const isWarning = percent >= 80;
                const isCritical = percent >= 100;
                return (
                  <div key={stat.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">{stat.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-on-surface-variant/60 tracking-widest">
                        <span className={cn("text-on-surface", isWarning && "text-amber-600", isCritical && "text-error")}>{stat.current}</span> / {formatPlanLimit(stat.limit)}
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
          </CardContent>
        </Card>
      </div>

      <div className="pt-10">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
          Plan Comparison Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {PLAN_ORDER.map((planId) => {
            const p = PLANS[planId];
            const isCurrent = (isTrial || isExpired) ? p.id === "pro" : p.name === plan.name || p.id === plan.id;
            return (
              <Card key={p.id} className={cn(
                "relative overflow-hidden rounded-3xl border transition-all duration-500 shadow-soft",
                isCurrent ? "border-primary bg-primary/[0.02] shadow-xl shadow-primary/5" : "border-outline-variant/30 bg-surface"
              )}>
                {isCurrent && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                )}
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-black text-on-surface tracking-tight font-headline-sm">{p.name}</CardTitle>
                  <CardDescription className="text-xs font-black text-primary uppercase tracking-widest">{p.price.display}{p.price.cadence ? ` ${p.price.cadence}` : ""}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 border-b border-outline-variant/10 pb-2">Operational Quotas</p>
                    <div className="space-y-2 text-[11px] font-bold text-on-surface-variant">
                      <div className="flex justify-between"><span>User Seats</span><span className="text-on-surface font-black">{formatPlanLimit(p.limits.maxUsers)}</span></div>
                      <div className="flex justify-between"><span>Branch Nodes</span><span className="text-on-surface font-black">{formatPlanLimit(p.limits.maxBranches)}</span></div>
                      <div className="flex justify-between"><span>SKU Repository</span><span className="text-on-surface font-black">{formatPlanLimit(p.limits.maxProducts)}</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 border-b border-outline-variant/10 pb-2">Capability Matrix</p>
                    <div className="space-y-3">
                      {[
                        { label: "Advanced Analytics", enabled: p.features.advancedReports, icon: "analytics" },
                        { label: "Data Export Nodes", enabled: p.features.exportData, icon: "ios_share" },
                        { label: "Bulk Manifest Import", enabled: p.features.csvImport, icon: "upload_file" },
                        { label: "Ecommerce Integration", enabled: p.features.darazIntegration || p.features.shopifyIntegration || p.features.woocommerceIntegration, icon: "hub" },
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-[11px] font-bold">
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
                  <Button 
                    variant={isCurrent ? "outline" : "default"} 
                    className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    disabled={isCurrent && status === "active"}
                  >
                    {isCurrent 
                      ? (isTrial ? "Initialize Subscription" : (isExpired ? "Reactivate Protocol" : "Current Protocol")) 
                      : `Upgrade Tier`
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
