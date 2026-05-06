import React from "react";
import { getPartnerStats, joinPartnerProgram } from "@/modules/partners/actions";
import { PartnerHero, PartnerStatsGrid, PartnerGrowthChart } from "@/components/partner/dashboard-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function PartnerDashboardPage() {
  const data = await getPartnerStats();

  async function handleJoinPartnerProgram() {
    "use server";
    await joinPartnerProgram();
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10 animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center shadow-soft border border-primary/20">
          <span className="material-symbols-outlined text-primary text-[48px]">handshake</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Join the <span className="text-primary italic">WhatsQuery</span> Network
          </h1>
          <p className="text-on-surface-variant text-lg font-medium max-w-lg mx-auto">
            Become a certified implementation partner and earn 15% recurring commission for every enterprise you onboard.
          </p>
        </div>
        <form action={handleJoinPartnerProgram}>
          <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 text-sm tracking-widest uppercase">
            Activate Partner Protocol
          </Button>
        </form>
      </div>
    );
  }

  const { partner, metrics, trendData } = data;

  return (
    <div className="space-y-10 flex-1 overflow-auto pb-20">
      
      <PartnerHero partnerCode={partner.partnerCode} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            <PartnerStatsGrid metrics={metrics} />
            <PartnerGrowthChart data={trendData} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                        Referral Manifest
                    </h3>
                    <Button variant="ghost" className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest h-auto p-0 hover:text-primary">
                        Download Node Audit <span className="material-symbols-outlined text-[14px] ml-1">download</span>
                    </Button>
                </div>

                <div className="border border-outline-variant/30 rounded-3xl overflow-hidden bg-surface shadow-soft">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-lowest">
                                <tr className="border-b border-outline-variant/30">
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Enterprise Node</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Onboarded</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {partner.referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-sm font-medium text-on-surface-variant italic">
                                            No active nodes detected in your network.
                                        </td>
                                    </tr>
                                ) : (
                                    partner.referrals.map((referral) => (
                                    <tr key={referral.id} className="hover:bg-surface-container-low/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">corporate_fare</span>
                                                </div>
                                                <span className="font-black text-on-surface text-sm tracking-tight">{referral.referredOrg?.name || "Pending Validation"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-medium text-on-surface-variant">
                                            {referral.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                referral.referredOrg?.subscription?.status === 'active' 
                                                    ? "bg-secondary/10 text-secondary border-secondary/20" 
                                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            )}>
                                                {referral.referredOrg?.subscription?.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[10px] font-black text-on-surface-variant tracking-widest uppercase text-right">
                                            {referral.referredOrg?.subscription?.planId || 'TRIAL'}
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
         </div>

         <div className="space-y-8">
            <Card className="rounded-3xl bg-primary/5 border-primary/10 shadow-soft">
                <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Commission Logic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-on-surface-variant">Standard Rate</span>
                        <span className="font-black text-primary">{(partner.commissionRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-on-surface-variant">Payout Floor</span>
                        <span className="font-black text-on-surface">Rs. 25,000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-on-surface-variant">Frequency</span>
                        <span className="font-black text-on-surface">Monthly Cycles</span>
                    </div>
                    <Button className="w-full h-11 mt-4 rounded-2xl">
                        Authorize Payout
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-outline-variant/30 shadow-soft">
                 <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant/40">account_balance_wallet</span>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Payout Log</CardTitle>
                 </CardHeader>
                 <CardContent className="py-12 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/20">
                        <span className="material-symbols-outlined text-3xl">history</span>
                    </div>
                    <p className="text-xs font-medium text-on-surface-variant max-w-[180px] mx-auto italic">Settlement history will populate upon protocol authorization.</p>
                 </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Strategy Intelligence</h4>
                <p className="text-xs font-medium text-on-surface-variant leading-relaxed">
                    "High-volume wholesalers represent the peak referral target. Focus on nodes with multi-branch reconciliation requirements."
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}

