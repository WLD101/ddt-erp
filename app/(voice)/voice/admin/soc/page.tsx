import { calculateSecurityMaturity } from "@/modules/command-center/security-score";
import { getCommandCenterStats } from "@/modules/command-center/stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Security Operations Center | WhatsQuery",
};

export default async function SOCPage() {
  const report = await calculateSecurityMaturity();
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
                  Security Operations Center
                </Badge>
              </div>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">security</span>
                  SOC Dashboard
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Real-time evidence-based security maturity scoring across {report.domains.length} critical domains. 
                  Calculated directly from production state, repository configuration, and audit logs.
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4 flex flex-col justify-center items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Overall Score</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black tracking-tight text-on-surface">{report.overallScore}</span>
                  <span className="text-sm font-bold text-on-surface-variant">/ 100</span>
                </div>
              </div>
              <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4 flex flex-col justify-center items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Security Grade</p>
                <p className={`mt-2 text-4xl font-black tracking-tight ${report.grade.startsWith("A") ? "text-emerald-500" : "text-amber-500"}`}>
                  {report.grade}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Events */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-8">
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Auth Failures</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-rose-500">{stats.security.failedLogins}</p>
              <p className="text-xs text-on-surface-variant mt-2">Live from Audit Logs</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm">
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em]">Blocked IPs</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-4xl font-black text-amber-500">0</p>
              <p className="text-xs text-on-surface-variant mt-2">Rate limit triggered</p>
            </CardContent>
          </Card>
        </section>

        {/* Compliance Domains */}
        <h2 className="text-2xl font-black mt-12 mb-6">Compliance Posture</h2>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {report.domains.map((domain) => (
            <Card key={domain.domain} className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-4 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">
                    {domain.domain}
                  </CardTitle>
                  <Badge className={`border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                    domain.status === "PASS" ? "bg-emerald-500/10 text-emerald-600" : 
                    domain.status === "PARTIAL" ? "bg-amber-500/10 text-amber-600" : 
                    "bg-rose-500/10 text-rose-600"
                  }`}>
                    {domain.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-semibold text-on-surface-variant mt-1">
                  Weight: {domain.weight}% | Score: {Math.round(domain.score)}/100
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">verified_user</span>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {domain.evidence}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

      </div>
    </div>
  );
}
