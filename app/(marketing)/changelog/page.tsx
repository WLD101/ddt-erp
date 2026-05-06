import { getPublishedChangelogs } from "@/modules/changelog/actions";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ShieldCheck, Bug, Calendar, ArrowRight } from "lucide-react";
import React from "react";

export default async function PublicChangelogPage() {
  const entries = await getPublishedChangelogs();

  return (
    <div className="flex flex-col w-full min-h-screen">
      <section className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="space-y-6 mb-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest leading-none mx-auto">
                <Sparkles className="w-3.5 h-3.5" /> Product Evolution
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9]">
                WhatsQuery <span className="text-primary italic">Release Notes</span>
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">
                Tracking every mutation, upgrade, and security reinforcement. Our commitment to transparent engineering.
            </p>
          </div>

          <div className="space-y-20 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
            
            {entries.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                    The intelligence stream is preparing for its first transmission. Check back soon.
                </div>
            ) : (
                entries.map((entry: any) => (
                    <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#020617] text-white shadow shadow-white/5 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shrink-0">
                            {getCategoryIcon(entry.category)}
                        </div>

                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden hover:border-primary/20 transition-all duration-500">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles className="w-16 h-16" />
                             </div>
                             
                             <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(entry.category)}`}>
                                    {entry.category}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : ""}
                                </span>
                             </div>

                             <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                                {entry.title}
                             </h3>

                             <p className="text-sm font-bold text-primary uppercase tracking-widest mb-6">
                                {entry.version || "STABLE RELEASE"}
                             </p>

                             <div className="text-muted-foreground text-sm leading-relaxed space-y-4 prose prose-invert">
                                {entry.content.split('\n').map((para: any, i: any) => (
                                    <p key={i}>{para}</p>
                                ))}
                             </div>
                        </div>
                    </div>
                ))
            )}

          </div>

        </div>
      </section>
    </div>
  );
}

function getCategoryIcon(category: string) {
    switch (category) {
        case 'FEATURE': return <Sparkles className="w-4 h-4 text-blue-400" />;
        case 'IMPROVEMENT': return <Zap className="w-4 h-4 text-primary" />;
        case 'FIX': return <Bug className="w-4 h-4 text-amber-500" />;
        case 'SECURITY': return <ShieldCheck className="w-4 h-4 text-rose-500" />;
        default: return <Sparkles className="w-4 h-4" />;
    }
}

function getCategoryStyles(category: string) {
    switch (category) {
        case 'FEATURE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'IMPROVEMENT': return 'bg-primary/10 text-primary border-primary/20';
        case 'FIX': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'SECURITY': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-white/5 text-muted-foreground border-white/10';
    }
}
