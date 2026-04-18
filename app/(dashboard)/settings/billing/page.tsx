import { getCurrentTenantContext } from "@/lib/tenant";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { PLANS } from "@/lib/billing/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, CreditCard, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function BillingSettingsPage() {
  const ctx = await getCurrentTenantContext();
  const subCtx = await getSubscriptionContext(ctx.organizationId);
  const { plan, status, daysRemaining, usage } = subCtx;

  const isTrial = status === "trialing";
  const isExpired = status === "expired";
  
  const usageStats = [
    { name: "Users", current: usage.users, limit: plan.limits.maxUsers },
    { name: "Products", current: usage.products, limit: plan.limits.maxProducts },
    { name: "Monthly Sales", current: usage.monthlyInvoices, limit: plan.limits.maxMonthlyInvoices },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
          Billing & <span className="text-primary">Subscription</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your workspace plan, view system usage, and seamlessly upgrade your limits to grow your business.
        </p>
      </div>

      {/* OVERVIEW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* State Card */}
        <Card className="col-span-1 border-white/5 bg-black/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <h2 className="text-4xl font-black tracking-tighter text-white">{plan.name}</h2>
            </div>
            
            {isTrial && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-bold text-amber-300 uppercase tracking-widest leading-none">Trial Ending</p>
                  <p className="text-xs text-amber-100/70 mt-1.5 leading-relaxed">
                    You have <span className="text-white font-bold">{daysRemaining} days</span> remaining on your Pro trial.
                  </p>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-bold text-rose-300 uppercase tracking-widest leading-none">Subscription Expired</p>
                  <p className="text-xs text-rose-100/70 mt-1.5 leading-relaxed">
                    Your workspace is currently locked to read-only access.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full font-bold uppercase tracking-widest text-xs h-12 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Manage Billing Portal
            </Button>
          </CardFooter>
        </Card>

        {/* Usage Card */}
        <Card className="col-span-1 lg:col-span-2 border-white/5 bg-black/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
              Workspace Consumption
            </CardTitle>
            <CardDescription>Your current utilization against {plan.name} limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {usageStats.map((stat) => {
                const percent = Math.min(100, Math.round((stat.current / stat.limit) * 100));
                const isWarning = percent >= 80;
                const isCritical = percent >= 100;
                return (
                  <div key={stat.name} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white/70">{stat.name}</span>
                      <span className="text-xs font-mono text-white/50">
                        <span className={cn("font-bold text-white", isWarning && "text-amber-400", isCritical && "text-rose-400")}>{stat.current}</span> / {stat.limit > 900000 ? 'Unlimited' : stat.limit}
                      </span>
                    </div>
                    {stat.limit < 900000 ? (
                      <Progress 
                        value={percent} 
                        className="h-2 bg-white/5" 
                        indicatorClassName={cn("bg-primary", isWarning && "bg-amber-400", isCritical && "bg-rose-500")}
                      />
                    ) : (
                       <Progress value={0} className="h-2 bg-white/5" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* PLAN COMPARISON */}
      <div className="pt-8">
        <h3 className="text-lg font-black uppercase tracking-widest text-white mb-6">Plan Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {Object.values(PLANS).map((p) => {
            const isCurrent = (isTrial || isExpired) ? p.id === "pro" : p.id === plan.id;
            return (
              <Card key={p.id} className={cn(
                "relative overflow-hidden border-white/5 bg-black/20 backdrop-blur-md transition-all duration-300",
                isCurrent && "border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] bg-primary/[0.02]"
              )}>
                {isCurrent && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400" />
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-black text-white">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-2">Limits</p>
                    <div className="space-y-2 text-sm text-white/80">
                      <div className="flex justify-between"><span>User Seats</span><span className="font-mono">{p.limits.maxUsers > 9000 ? 'Unlimited' : p.limits.maxUsers}</span></div>
                      <div className="flex justify-between"><span>Branches</span><span className="font-mono">{p.limits.maxBranches > 900 ? 'Unlimited' : p.limits.maxBranches}</span></div>
                      <div className="flex justify-between"><span>Products</span><span className="font-mono">{p.limits.maxProducts > 900000 ? 'Unlimited' : p.limits.maxProducts.toLocaleString()}</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-2">Features</p>
                    <div className="space-y-2 text-sm text-white/80">
                      <div className="flex items-center gap-2">
                        {p.features.advancedReports ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-white/20" />}
                        <span className={cn(!p.features.advancedReports && "text-white/40")}>Advanced Reports</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.features.exportData ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-white/20" />}
                        <span className={cn(!p.features.exportData && "text-white/40")}>Data Exports (CSV/PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.features.auditLogs ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-white/20" />}
                        <span className={cn(!p.features.auditLogs && "text-white/40")}>Security Audit Logs</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={isCurrent ? "outline" : "default"} 
                    className="w-full font-bold uppercase tracking-widest text-xs"
                    disabled={isCurrent && status === "active"}
                  >
                    {isCurrent 
                      ? (isTrial ? "Subscribe Now" : (isExpired ? "Reactivate Plan" : "Current Plan")) 
                      : `Upgrade to ${p.name.split(" ")[0]}`
                    }
                    {!isCurrent || isTrial || isExpired ? <ArrowRight className="w-4 h-4 ml-2" /> : null}
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
