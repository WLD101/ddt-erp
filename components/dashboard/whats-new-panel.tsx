"use client";

import React, { useState } from "react";
import { Sparkles, X, Calendar, ArrowRight, Zap, Bug, ShieldCheck, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChangelogEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  version?: string | null;
  publishedAt?: Date | string | null;
}

export function WhatsNewTrigger({ entries }: { entries: ChangelogEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all duration-300 ease-out hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 group"
      >
        <div className="flex items-center space-x-3">
          <span className="text-primary/70 group-hover:animate-pulse"><Newspaper className="w-4 h-4"/></span>
          <span>What's New</span>
        </div>
        {entries.length > 0 && (
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
        )}
      </button>

      {/* Slide-over Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-[#020617] border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase italic tracking-tighter">WhatsQuery Intelligence</h3>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Product Stream</p>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white hover:bg-white/5">
                  <X className="w-4 h-4" />
               </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {entries.length === 0 ? (
                   <div className="text-center py-20 text-muted-foreground italic text-sm">
                       No recent updates found. We're building something great.
                   </div>
               ) : (
                   entries.map(entry => (
                       <div key={entry.id} className="space-y-4 group">
                           <div className="flex items-center justify-between">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(entry.category)}`}>
                                   {entry.category}
                               </span>
                               <span className="text-[10px] font-bold text-white/30 truncate max-w-[100px] uppercase">
                                   {entry.version || "STABLE"}
                               </span>
                           </div>
                           <h4 className="font-bold text-white group-hover:text-primary transition-colors pr-4 leading-tight">
                               {entry.title}
                           </h4>
                           <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 italic">
                               {entry.content}
                           </p>
                           <div className="flex items-center justify-between pt-2">
                               <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                   {entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : "RECENT"}
                               </span>
                               <Button variant="ghost" size="sm" className="h-6 text-[10px] font-black uppercase tracking-tighter text-primary p-0 hover:bg-transparent hover:translate-x-1 transition-transform">
                                   Read Notes <ArrowRight className="w-2 h-2 ml-1" />
                               </Button>
                           </div>
                           <div className="h-[1px] w-full bg-white/5 mt-6" />
                       </div>
                   ))
               )}
            </div>

            <div className="p-6 bg-white/[0.01] border-t border-white/5">
                <Button className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] py-6 shadow-xl shadow-primary/10">
                    View Full Changelog
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
