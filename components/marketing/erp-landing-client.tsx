"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BarChart3, 
  Globe, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Package,
  Receipt,
  ShoppingCart,
  Plus,
  Minus,
  HelpCircle,
  Truck,
  RotateCw,
  RefreshCw,
  Building,
  Store
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ErpLandingClientProps = {
  trialHref: string;
  demoHref: string;
};

const FAQS = [
  {
    question: "How does the Shopify, WooCommerce, and Daraz sync work?",
    answer: "WhatsQuery connects directly to your digital storefronts via native APIs. When a customer purchases a product on Shopify or Daraz, stock levels are instantly updated across all other connected stores and physical warehouses in real time. Product catalog edits and stock replenishments sync automatically without manual imports."
  },
  {
    question: "Can I manage multiple physical branches and warehouses?",
    answer: "Yes, fully! WhatsQuery is built for multi-branch operations. You can track inventory levels at separate physical storefronts, manage dedicated warehouses, transfer stock between locations with transit logs, and assign location-based roles to your cashiers and warehouse staff."
  },
  {
    question: "How does the AI stock forecasting prevent stockouts?",
    answer: "Our intelligent forecasting engine analyzes your historical sales velocity, transit lead times, and seasonal spikes. When stock falls below the dynamically calculated reorder point, the system automatically drafts a recommended Purchase Order (PO) for your supplier, ensuring you never miss a sale due to a stockout."
  },
  {
    question: "Is the accounting module compliant with local tax regulations?",
    answer: "Absolutely. WhatsQuery handles standard double-entry bookkeeping, generates instant general ledger entries for all sales, purchases, and payments, and automatically calculates localized sales tax (such as FBR-compliant GST) on your invoicing."
  },
  {
    question: "Can we use barcode scanners and print thermal receipts?",
    answer: "Yes, our POS and Invoicing flows are optimized for barcode scanners. You can generate and print barcode stickers, scan items at checkout, and instantly print standard 80mm/58mm thermal receipts or full-page PDF invoices."
  }
];

export function ErpLandingClient({ trialHref, demoHref }: ErpLandingClientProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "sales" | "accounting" | "sync">("inventory");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [tickerStock, setTickerStock] = useState(48);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => {
        setTickerStock((prev) => {
          const next = prev - 1;
          return next <= 15 ? 48 : next;
        });
        setIsSyncing(false);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-24">
      {/* Dynamic Hero Left Inner & Interactive Right Visuals */}
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        {/* Left Side Hook */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold tracking-wider text-indigo-300 uppercase animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Ready Enterprise ERP Hub</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] text-white">
            Unified operations.<br/>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">Zero spreadsheet chaos.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
            Eliminate double data entries. Keep stock counts, cash registers, general ledgers, and ecommerce channels synced automatically.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button asChild size="lg" className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/25">
              <Link href={trialHref}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition">
              <Link href={demoHref}>Book Demo</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Multilingual POS</h4>
                <p className="text-xs text-slate-500">Fast checkout, offline support</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">FBR & Tax Ready</h4>
                <p className="text-xs text-slate-500">Filer status & FBR logs ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive ERP Dashboard Simulator */}
        <div className="lg:col-span-6">
          <div className="relative rounded-[32px] border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-xl">
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/50"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500/50"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500/50"></span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <span className={`h-1.5 w-1.5 rounded-full bg-indigo-500 ${isSyncing ? "animate-ping" : ""}`}></span>
                <span>{isSyncing ? "Syncing channels..." : "System Synced"}</span>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-6">
              {[
                { id: "inventory", label: "Stock", icon: Package },
                { id: "sales", label: "POS", icon: Receipt },
                { id: "accounting", label: "Ledger", icon: BarChart3 },
                { id: "sync", label: "Sync", icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      active 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                        : "bg-black/20 border-transparent text-slate-500 hover:text-slate-300 hover:bg-black/35"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulated Content Area */}
            <div className="min-h-[220px] rounded-2xl bg-black/40 border border-white/5 p-5 relative overflow-hidden flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeTab === "inventory" && (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Item: Cotton Oxford Shirt</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tickerStock <= 20 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" : "bg-indigo-500/10 text-indigo-400"}`}>
                        {tickerStock <= 20 ? "Low Stock" : "Stock Normal"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Warehouse</span>
                        <span className="text-lg font-black text-white">{tickerStock} pcs</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Shopify</span>
                        <span className="text-lg font-black text-white">{tickerStock - 2} pcs</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Daraz</span>
                        <span className="text-lg font-black text-white">{tickerStock - 3} pcs</span>
                      </div>
                    </div>

                    {tickerStock <= 20 && (
                      <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-2.5 text-xs text-rose-200 flex items-center justify-between">
                        <span>Reorder point hit. AI drafted PO.</span>
                        <span className="text-[9px] font-black text-rose-400 underline">Send to Supplier</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "sales" && (
                  <motion.div
                    key="sales"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active POS Register</span>
                      <span className="text-[10px] text-indigo-400 font-bold">Terminal #01</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-white border-b border-white/5 pb-2">
                        <span>1x Cotton Oxford Shirt</span>
                        <span>4,500 PKR</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white border-b border-white/5 pb-2">
                        <span>2x Slim-Fit Denim</span>
                        <span>7,000 PKR</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Total tax (18% GST)</span>
                        <span className="text-xs text-slate-400">1,754 PKR</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Net Amount</span>
                        <span className="text-xl font-black text-indigo-400">11,500 PKR</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "accounting" && (
                  <motion.div
                    key="accounting"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">General Ledger Feed</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Double Entry</span>
                    </div>

                    <div className="space-y-2 text-[11px] font-mono leading-relaxed">
                      <div className="flex justify-between text-emerald-400 bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10">
                        <span>Debit: Cash/Bank Account</span>
                        <span>+11,500 PKR</span>
                      </div>
                      <div className="flex justify-between text-purple-400 bg-purple-500/5 p-1.5 rounded-lg border border-purple-500/10">
                        <span>Credit: Revenue (Sales)</span>
                        <span>-9,746 PKR</span>
                      </div>
                      <div className="flex justify-between text-amber-400 bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10">
                        <span>Credit: Tax Payable (GST)</span>
                        <span>-1,754 PKR</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "sync" && (
                  <motion.div
                    key="sync"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Multi-Channel Inventory</span>
                      <span className="text-slate-500 text-[10px]">Auto-reconciled</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2 text-white">
                          <ShoppingCart className="h-4 w-4 text-[#96BF48]" />
                          Shopify Store
                        </span>
                        <span className="font-bold text-[#A7B0C0]">Synced (2 mins ago)</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2 text-white">
                          <Store className="h-4 w-4 text-[#FF6B00]" />
                          Daraz Pakistan
                        </span>
                        <span className="font-bold text-[#A7B0C0]">Synced (1 min ago)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-white">
                          <Building className="h-4 w-4 text-[#21D4FD]" />
                          Lahore Warehouse
                        </span>
                        <span className="font-bold text-indigo-400">Master Stock</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ticker bottom indicator */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Demo Workspace</span>
                <span>Active Channels: 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Grid */}
      <section id="solutions" className="space-y-12">
        <div className="text-center space-y-4">
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">Built For Your Niche</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">WhatsQuery provides modules custom-tailored to handle specific retail and trading niches.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              niche: "Wholesale & Distribution",
              desc: "Manage partial payments, print delivery challans, track customer credits, and check due dates with automated notifications.",
              icon: Truck,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
            },
            {
              niche: "Multi-Store Retail",
              desc: "Connect physical POS cash registers, print barcode tags, track branch sales, and complete instant stock transfers.",
              icon: Store,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            },
            {
              niche: "Connected E-commerce",
              desc: "Merge Shopify, WooCommerce, and Daraz into one hub. Auto-download orders, sync stock, and centralize catalog updates.",
              icon: ShoppingCart,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            },
            {
              niche: "Garments & Manufacturing",
              desc: "Manage raw material bills of materials, trace fabrics, track batch manufacturing stages, and record finished goods cost.",
              icon: Layers,
              color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="glass-card p-6 rounded-[24px] border border-white/5 bg-slate-900/40 space-y-6 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white tracking-tight">{item.niche}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Metrics Section */}
      <section className="rounded-[40px] border border-white/10 bg-gradient-to-b from-indigo-950/15 to-transparent p-10 md:p-14 text-center">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { metric: "99.9%", label: "Inventory Accuracy", desc: "Automated SKU syncing" },
            { metric: "4.8 hrs", label: "Saved Daily", desc: "No double entries" },
            { metric: "+15%", label: "Profit Margin Increase", desc: "Optimized stock levels" },
            { metric: "100+", label: "Connected Channels", desc: "Shopify, Daraz, and Retail" }
          ].map((m, index) => (
            <div key={index} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-indigo-400 tracking-tight">{m.metric}</div>
              <h4 className="text-sm font-bold text-white">{m.label}</h4>
              <p className="text-[11px] text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="space-y-12 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">Got questions? We have answers.</h3>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div 
                key={index} 
                className="rounded-3xl border border-white/5 bg-slate-900/40 overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-white hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all border border-white/5">
                    {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="p-6 pt-0 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 bg-black/10">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
