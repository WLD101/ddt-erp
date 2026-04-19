"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Link, X, Users, TrendingUp, DollarSign, Target, Award } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Enhanced Hero with Copy-to-Clipboard and Social Share intents
 */
export function PartnerHero({ partnerCode }: { partnerCode: string }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://nexuserp.com/?ref=${partnerCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=Transform your business with NexusERP! Track every branch, SKU, and transaction in one place. ${referralLink}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-1">
          <Award className="w-4 h-4" /> Certified Reseller Account
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">
          Partner <span className="text-primary italic">Intelligence</span>
        </h2>
        <p className="text-muted-foreground text-sm">Growth metrics and referral orchestration center.</p>
      </div>
      
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 ring-4 ring-primary/5">
        <div className="px-4 py-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none mb-1">Your Referral Engine</span>
            <span className="text-sm font-mono text-white/90 truncate max-w-[200px] inline-block">{referralLink}</span>
        </div>
        <div className="flex items-center gap-1 pr-1">
            <Button onClick={copyToClipboard} size="icon" variant="ghost" className="h-10 w-10 hover:bg-white/5 text-primary">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <Button onClick={shareX} size="icon" variant="ghost" className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
            </Button>
            <Button onClick={shareLinkedIn} size="icon" variant="ghost" className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white">
                <Link className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Performance metrics grid with trend indicators
 */
export function PartnerStatsGrid({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-black/40 border-white/5 shadow-xl hover:border-primary/20 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signups</CardTitle>
          <Users className="w-3.5 h-3.5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{metrics.totalReferrals}</div>
          <div className="flex items-center gap-1.5 mt-1">
             <TrendingUp className="w-3 h-3 text-emerald-400" />
             <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Lifetime Growth</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/5 shadow-xl hover:border-emerald-500/20 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversion</CardTitle>
          <Target className="w-3.5 h-3.5 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{metrics.conversionRate.toFixed(1)}%</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Trial to Paid Ratio</p>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/5 shadow-xl hover:border-rose-500/20 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Share</CardTitle>
          <DollarSign className="w-3.5 h-3.5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">${metrics.estimatedRevenueShare.toFixed(2)}</div>
          <p className="text-[10px] text-primary/80 uppercase tracking-widest mt-1">Active recurring value</p>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/5 shadow-xl hover:border-amber-500/20 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pipeline</CardTitle>
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">${metrics.pipelineValue.toFixed(2)}</div>
          <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">Unconverted Trials</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Growth Trend Visualization
 */
export function PartnerGrowthChart({ data }: { data: any[] }) {
  return (
    <Card className="bg-black/40 border-white/5 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.01]">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/70">Growth Performance</CardTitle>
        <CardDescription className="text-xs">Cumulative Monthly Growth & Estimated Revenue Trend</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[250px] w-full mt-6 px-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area 
                type="monotone" 
                dataKey="referrals" 
                stroke="#7c3aed" 
                fillOpacity={1} 
                fill="url(#colorRef)" 
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                opacity={0.5}
                fill="none" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
