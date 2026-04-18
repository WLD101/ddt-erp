import { getPlatformOverview } from "@/modules/platform/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Activity, Building, CalendarClock, ShieldAlert } from "lucide-react";

export default async function PlatformDashboardPage() {
  const { metrics, recentSignups } = await getPlatformOverview();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
          Macro <span className="text-rose-500">Analytics</span>
        </h2>
        <p className="text-muted-foreground text-sm">System oversight across all provisioned workspaces.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Sub Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">${metrics.estimatedMRR.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">From {metrics.activePaid} active upgrades</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Production Tenants</CardTitle>
            <Building className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{metrics.totalTenants}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Excluding {metrics.totalDemos} demo vaults</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Trials</CardTitle>
            <Activity className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{metrics.activeTrials}</div>
            <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">Pending Conversion</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Trials</CardTitle>
            <CalendarClock className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{metrics.expiredTrials}</div>
            <p className="text-[10px] text-rose-400/80 uppercase tracking-widest mt-1">At Risk / Locked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-2">
          <Card className="bg-black/40 border-white/5 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-black text-white">Recent Conversions & Signups</CardTitle>
              <CardDescription>The 10 most recently initiated subscriptions across the server.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSignups.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No recent activity detected.</p>
                ) : (
                  recentSignups.map((sub) => {
                    const isTrial = sub.status === "trialing";
                    const isDemo = sub.organization.name.includes("Demo") || sub.planId === "demo";
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {sub.organization.name}
                            {isDemo && <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] uppercase tracking-widest font-black line-clamp-1">Demo</span>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sub.organization.createdAt.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 space-x-2 text-[10px] uppercase font-black tracking-widest rounded-md border ${
                            isTrial ? "border-amber-500/20 text-amber-400 bg-amber-500/10" : "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                          }`}>
                            {sub.planId} 
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Warnings */}
        <div className="lg:col-span-1">
          <Card className="bg-rose-500/5 border-rose-500/20 h-full">
            <CardHeader>
               <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-rose-500" />
                 System Warnings
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {metrics.expiredTrials > 0 && (
                 <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                   <p className="text-sm font-bold text-rose-200">Stale Workspaces Detected</p>
                   <p className="text-xs text-rose-200/70 mt-1">There are {metrics.expiredTrials} tenants locked out due to expired trials. Consider launching a re-engagement email campaign or purging them to save database load.</p>
                 </div>
               )}
               {metrics.totalDemos > (metrics.totalTenants * 3) && (
                 <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                   <p className="text-sm font-bold text-amber-200">High Demo Velocity</p>
                   <p className="text-xs text-amber-200/70 mt-1">Demo organizations are rapidly outpacing real tenants. Ensure the automated cleanup CRON job is firing perfectly.</p>
                 </div>
               )}
               <p className="text-xs italic text-muted-foreground pt-4 border-t border-rose-500/10">No critical database anomalies detected.</p>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
