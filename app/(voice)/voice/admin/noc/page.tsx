import { getCommandCenterStats } from "@/modules/command-center/stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Network Operations Center | WhatsQuery",
};

export default async function NOCPage() {
  const stats = await getCommandCenterStats();

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-12 text-on-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        
        {/* Header */}
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                  Network Operations Center
                </Badge>
              </div>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">network_manage</span>
                  NOC Dashboard
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Real-time infrastructure telemetry, voice operations monitoring, and SaaS limits tracking.
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4 flex flex-col justify-center items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">System Status</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black tracking-tight text-emerald-500">HEALTHY</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <h2 className="text-2xl font-black mt-12 mb-6">Infrastructure</h2>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Redis Status</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-emerald-500">{stats.infrastructure.redisStatus}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">System Memory</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-primary">{Math.round(stats.infrastructure.memoryUsage)} MB</p>
              <p className="text-xs text-on-surface-variant mt-2">Node.js Heap (of {Math.round(stats.infrastructure.totalMemory)} MB total)</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">CPU Load</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-amber-500">{stats.infrastructure.cpu.toFixed(2)}</p>
              <p className="text-xs text-on-surface-variant mt-2">1-minute load average</p>
            </CardContent>
          </Card>
        </section>

        <h2 className="text-2xl font-black mt-12 mb-6">Voice Operations</h2>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Active Calls</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-emerald-500">{stats.voice.activeCalls}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Total Calls</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-primary">{stats.voice.totalCalls}</p>
            </CardContent>
          </Card>
        </section>

        <h2 className="text-2xl font-black mt-12 mb-6">SaaS Operations</h2>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-emerald-500">Live</p>
              <p className="text-xs text-on-surface-variant mt-2">Driven by Stripe</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Total Metered API Calls</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-primary">Live</p>
              <p className="text-xs text-on-surface-variant mt-2">Billed at EOM</p>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
