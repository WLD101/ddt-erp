import { getPlatformOverview, getGlobalAuditLogs, getSystemHealth } from "@/modules/platform/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  Users, 
  Activity, 
  Building, 
  CalendarClock, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Database, 
  History,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function PlatformDashboardPage() {
  const [
    { metrics, recentSignups },
    auditLogs,
    systemHealth
  ] = await Promise.all([
    getPlatformOverview(),
    getGlobalAuditLogs(),
    getSystemHealth()
  ]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full w-fit">
            <Zap className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Live Infrastructure Status</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4 mt-2">
            Command <span className="text-rose-500">Center</span>
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Real-time oversight across all provisioned workspaces and global ledger.</p>
        </div>

        <div className="hidden lg:flex items-center gap-6">
           <div className="text-right">
             <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">System Load</p>
             <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
               <Activity className="w-3 h-3" /> Nominal
             </p>
           </div>
           <div className="h-10 w-px bg-white/10" />
           <div className="text-right">
             <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Database</p>
             <p className="text-sm font-bold text-blue-400 flex items-center justify-end gap-1">
               <Database className="w-3 h-3" /> {systemHealth.invoices + systemHealth.movements} Records
             </p>
           </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estimated MRR</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">${metrics.estimatedMRR.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">From {metrics.activePaid} active upgrades</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Globe className="w-24 h-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Tenants</CardTitle>
            <Building className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{metrics.totalTenants}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Active production instances</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-24 h-24 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Trials</CardTitle>
            <Activity className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{metrics.activeTrials}</div>
            <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">Pending Conversion</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <CalendarClock className="w-24 h-24 text-rose-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">At-Risk Accounts</CardTitle>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{metrics.expiredTrials}</div>
            <p className="text-[10px] text-rose-400/80 uppercase tracking-widest mt-1">Expired / Locked Trials</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Global Audit Manifest */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <Card className="bg-black/40 border-white/5 grow flex flex-col overflow-hidden">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-5 h-5 text-rose-500" />
                  Global Audit Manifest
                </CardTitle>
                <CardDescription className="text-xs">Live stream of critical actions across all provisioned workspaces.</CardDescription>
              </div>
              <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                Real-Time
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[600px] scrollbar-hide">
              <div className="divide-y divide-white/5">
                {auditLogs.length === 0 ? (
                  <p className="p-8 text-sm text-muted-foreground italic text-center">No system actions recorded in the current epoch.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-start gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                         <Activity className="w-4 h-4 text-white/40 group-hover:text-rose-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-white">
                            {log.user.name || log.user.email} 
                            <span className="text-muted-foreground font-normal mx-2">on</span>
                            <span className="text-primary italic">{log.organization.name}</span>
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 italic">
                          Executed <span className="text-white font-bold uppercase tracking-widest not-italic">{log.action.replace("_", " ")}</span> on {log.entityType} ID: {log.entityId}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health & Warnings */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-rose-500/5 border-rose-500/20 shadow-2xl">
            <CardHeader className="border-b border-rose-500/10">
               <CardTitle className="text-lg font-black text-rose-100 flex items-center gap-2 uppercase tracking-wider">
                 <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                 Global Anomalies
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
               {metrics.expiredTrials > 0 && (
                 <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                   <p className="text-sm font-black text-rose-200 uppercase tracking-widest">Stale Workspaces</p>
                   <p className="text-xs text-rose-200/70 mt-2 font-medium">There are {metrics.expiredTrials} tenants locked out due to expired trials. High risk of DB bloat from unfinalized demos.</p>
                 </div>
               )}
               {metrics.totalDemos > (metrics.totalTenants * 3) && (
                 <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                   <p className="text-sm font-black text-amber-200 uppercase tracking-widest">High Demo Velocity</p>
                   <p className="text-xs text-amber-200/70 mt-2 font-medium">Demo organizations are rapidly outpacing real tenants (Ratio &gt; 3:1). Review automated purge CRON.</p>
                 </div>
               )}
               <p className="text-[10px] italic text-muted-foreground pt-4 border-t border-rose-500/10 text-center uppercase tracking-widest">
                 System Watch: Level-1 Clearance Required
               </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/5 shadow-2xl">
            <CardHeader className="border-b border-white/5">
               <CardTitle className="text-xs font-black text-white uppercase tracking-[0.2em]">Infrastructure Manifest</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-blue-500" /></div>
                   <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Invoices</span>
                 </div>
                 <span className="font-mono text-sm text-white font-bold">{systemHealth.invoices.toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/10 rounded-lg"><Building className="w-4 h-4 text-purple-500" /></div>
                   <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global SKUs</span>
                 </div>
                 <span className="font-mono text-sm text-white font-bold">{systemHealth.products.toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-4 h-4 text-emerald-500" /></div>
                   <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Log Entries</span>
                 </div>
                 <span className="font-mono text-sm text-white font-bold">{auditLogs.length.toLocaleString()}+</span>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
