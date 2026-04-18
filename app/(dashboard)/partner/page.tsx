import React from "react";
import { getPartnerStats, joinPartnerProgram } from "@/modules/partners/actions";
import { PartnerHero, PartnerStatsGrid, PartnerGrowthChart } from "@/components/partner/dashboard-items";
import { Button } from "@/components/ui/button";
import { Handshake, ArrowUpRight, Building, Wallet, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function PartnerDashboardPage() {
  const data = await getPartnerStats();

  if (!data) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-700">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
          <Handshake className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white">
            Join the <span className="text-primary italic">Success</span> Network
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Become a certified reseller and earn 15% recurring commission for every business you bring into the cloud.
          </p>
        </div>
        <form action={joinPartnerProgram}>
          <Button size="lg" className="rounded-full px-10 bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/20">
            Activate Partner Account
          </Button>
        </form>
      </div>
    );
  }

  const { partner, metrics, trendData } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* 1. Header & Quick Link */}
      <PartnerHero partnerCode={partner.partnerCode} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 2. Stats Column (2/3) */}
         <div className="lg:col-span-2 space-y-8">
            <PartnerStatsGrid metrics={metrics} />
            <PartnerGrowthChart data={trendData} />
            
            {/* 3. Detailed Ledger */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter italic">
                        Referral <span className="text-primary italic">Archive</span>
                    </h3>
                    <Button variant="ghost" className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest h-auto p-0 hover:text-white">
                        Full CSV Export <ArrowUpRight className="ml-1 w-3 h-3" />
                    </Button>
                </div>

                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Organization</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Onboarded</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Pipeline Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Tier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {partner.referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                                            No tracking signals yet. Link shared?
                                        </td>
                                    </tr>
                                ) : (
                                    partner.referrals.map((referral) => (
                                    <tr key={referral.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                                    <Building className="w-4 h-4 text-white/50 group-hover:text-primary" />
                                                </div>
                                                <span className="font-bold text-white/90">{referral.referredOrg?.name || "Initializing..."}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {referral.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                referral.referredOrg?.subscription?.status === 'active' 
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            }`}>
                                                {referral.referredOrg?.subscription?.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black text-white/60 tracking-widest italic group-hover:text-primary transition-colors">
                                            {referral.referredOrg?.subscription?.planId?.toUpperCase() || 'TRIAL'}
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

         {/* 4. Side Info Column (1/3) */}
         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/80">Commission Logic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Standard Rate</span>
                        <span className="text-white font-bold">{partner.commissionRate * 100}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Payout Threshold</span>
                        <span className="text-white font-bold">$100.00</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="text-white font-bold text-right">Every 1st of Month</span>
                    </div>
                    <Button className="w-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-9 mt-4 shadow-xl">
                        Request Payout
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5 shadow-xl">
                 <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/80 leading-none">Payout History</CardTitle>
                 </CardHeader>
                 <CardContent className="py-12 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-white/20" />
                    </div>
                    <p className="text-xs text-muted-foreground italic">Scheduled reports will appear here once commissions cross the $100 threshold.</p>
                 </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Reseller Tip</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    "Reach out to wholesalers directly. NexusERP thrives in multi-sku environments where inventory accuracy is the #1 pain point."
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}
