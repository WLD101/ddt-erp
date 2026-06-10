"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  Calendar, 
  Database, 
  Globe, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  TrendingDown,
  Shield,
  Key,
  FileText,
  Link2,
  Lock,
  HeartPulse,
  Utensils,
  Home as HomeIcon,
  Scale,
  Car,
  Wrench,
  Stethoscope
} from "lucide-react";

type VoiceLandingPageClientProps = {
  loginHref: string;
  onboardingHref: string;
  dashboardHref: string;
};

export function VoiceLandingPageClient({
  loginHref,
  onboardingHref,
  dashboardHref,
}: VoiceLandingPageClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mockupStep, setMockupStep] = useState(0);

  // Auto-advance mockup steps for interactive animation
  useEffect(() => {
    const timer = setInterval(() => {
      setMockupStep((prev) => (prev + 1) % 6);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-[#FFFFFF] font-sans selection:bg-[#21D4FD]/30 selection:text-white overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#21D4FD]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-[30vh] right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20vh] left-10 w-[500px] h-[500px] bg-[#21D4FD]/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. NAVBAR */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-[#050816]/75 backdrop-blur-md border-b border-white/5 py-4" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-white/10">
              <img src="/logo-emblem.png" alt="WhatsQuery Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-[#A7B0C0] bg-clip-text text-transparent group-hover:text-white transition-all">
              WhatsQuery Voice
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#A7B0C0]">
            <Link href="#features" className="hover:text-white transition-colors">Product</Link>
            <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link href="#enterprise" className="hover:text-white transition-colors">Enterprise</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href={loginHref} 
              className="text-sm font-semibold text-[#A7B0C0] hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link 
              href={onboardingHref}
              className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-[#050816] bg-[#21D4FD] shadow-lg shadow-[#21D4FD]/25 hover:shadow-[#21D4FD]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Demo
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
        <div className="mx-auto max-w-7xl w-full grid gap-16 lg:grid-cols-12 lg:items-center">
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#21D4FD]/20 bg-[#21D4FD]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#21D4FD]"
            >
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span>Next-Gen Voice Agents for Enterprise</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-[54px] sm:text-[76px] lg:text-[84px] font-extrabold tracking-tight leading-[0.95] text-white"
              >
                Never Miss <br />
                Another <span className="bg-gradient-to-r from-[#21D4FD] via-indigo-400 to-violet-500 bg-clip-text text-transparent">Customer Call</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="max-w-2xl text-lg sm:text-xl text-[#A7B0C0] leading-relaxed"
              >
                AI receptionists that answer instantly, qualify leads, schedule appointments, and update your ERP automatically.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link 
                href={onboardingHref}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#21D4FD] to-blue-500 px-8 py-4 text-sm font-black text-[#050816] shadow-lg shadow-[#21D4FD]/20 hover:shadow-[#21D4FD]/45 hover:scale-[1.03] transition-all"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-8 py-4 text-sm font-bold text-white hover:border-[#21D4FD]/45 hover:bg-white/10 transition-all"
              >
                <Play className="h-4 w-4 fill-white text-white" />
                <span>Listen to Live Calls</span>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                "24/7 Availability",
                "Human-like Voice",
                "ERP Connected",
                "Deploy in Days"
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#21D4FD]" />
                  <span className="text-xs font-semibold text-[#A7B0C0]">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Right: Premium Mockup */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-[380px] rounded-[48px] border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/90 p-4 shadow-2xl backdrop-blur-lg"
            >
              {/* Outer screen gloss */}
              <div className="absolute inset-0 rounded-[48px] border border-white/5 pointer-events-none"></div>

              {/* Phone interface container */}
              <div className="rounded-[36px] bg-[#07091e] overflow-hidden border border-white/5 p-4 min-h-[480px] flex flex-col justify-between">
                
                {/* Header status bar */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-2 py-1">
                  <span>WhatsQuery AI</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[#21D4FD]">AGENT CONNECTED</span>
                  </div>
                </div>

                {/* Animated conversation bubbles */}
                <div className="flex-1 my-6 space-y-4 flex flex-col justify-end text-xs">
                  
                  {/* Phone Ringing state */}
                  {mockupStep === 0 && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="h-16 w-16 bg-[#21D4FD]/10 text-[#21D4FD] rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Incoming Call...</p>
                        <p className="text-slate-400 mt-1">AI Receptionist Answering</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Customer bubble */}
                  {mockupStep >= 1 && (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-[#A7B0C0]"
                    >
                      <span className="font-black text-white block mb-1">Customer</span>
                      "I'd like to book an appointment for tomorrow afternoon."
                    </motion.div>
                  )}

                  {/* AI bubble */}
                  {mockupStep >= 2 && (
                    <motion.div 
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-gradient-to-tr from-[#21D4FD]/10 to-[#21D4FD]/20 border border-[#21D4FD]/20 rounded-2xl rounded-tr-none p-3 max-w-[85%] self-end text-right"
                    >
                      <span className="font-black text-[#21D4FD] block mb-1">WhatsQuery AI</span>
                      "Sure, I can schedule that for you. What time works best?"
                    </motion.div>
                  )}

                  {/* Customer time preference */}
                  {mockupStep >= 3 && (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-[#A7B0C0]"
                    >
                      "Is 3:00 PM tomorrow available?"
                    </motion.div>
                  )}

                  {/* Final AI response */}
                  {mockupStep >= 4 && (
                    <motion.div 
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-gradient-to-tr from-[#21D4FD]/10 to-[#21D4FD]/20 border border-[#21D4FD]/20 rounded-2xl rounded-tr-none p-3 max-w-[85%] self-end text-right"
                    >
                      "Yes! I have booked you for tomorrow at 3:00 PM."
                    </motion.div>
                  )}
                </div>

                {/* Outcome checklist alerts at the bottom */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  {mockupStep >= 3 && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-black uppercase tracking-wider">✓ Lead Captured</span>
                    </motion.div>
                  )}
                  {mockupStep >= 4 && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-[10px] bg-[#21D4FD]/10 border border-[#21D4FD]/20 text-[#21D4FD] px-3 py-1.5 rounded-xl"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-black uppercase tracking-wider">✓ Appointment Scheduled</span>
                    </motion.div>
                  )}
                  {mockupStep >= 5 && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl"
                    >
                      <Database className="h-3.5 w-3.5" />
                      <span className="font-black uppercase tracking-wider">✓ ERP Updated Sync</span>
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. TRUST SECTION */}
      <section className="py-24 border-t border-white/5 bg-slate-950/20 px-6">
        <div className="mx-auto max-w-7xl text-center space-y-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A7B0C0] font-black">
            Trusted by modern businesses & scaling teams
          </p>

          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-16 opacity-60">
            {[
              { icon: HeartPulse, label: "Healthcare Clinic" },
              { icon: Utensils, label: "Fine Dining Group" },
              { icon: HomeIcon, label: "Real Estate Brokers" },
              { icon: Scale, label: "Professional Law Firms" },
              { icon: Car, label: "Automotive Care" },
              { icon: Wrench, label: "Home Services" }
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-3 rounded-full hover:bg-white/10 hover:scale-105 transition-all">
                <badge.icon className="h-4 w-4 text-[#21D4FD]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION */}
      <section className="py-32 px-6 relative">
        <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-12 lg:items-center">
          
          {/* Stat panel left */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {[
              { val: "62%", desc: "of incoming business calls go completely unanswered" },
              { val: "78%", desc: "of callers won't call back if they hit voicemail" },
              { val: "24/7", desc: "response coverage including weekends and after-hours" },
              { val: "-70%", desc: "lower operational costs compared to human call agencies" }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-3xl border border-white/5 bg-slate-950/30 p-6 space-y-2">
                <div className="text-4xl font-extrabold text-[#21D4FD] tracking-tight">{stat.val}</div>
                <div className="text-xs text-[#A7B0C0] leading-relaxed">{stat.desc}</div>
              </div>
            ))}
          </div>

          {/* Context panel right */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">The Cost of Silence</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Every Missed Call Is <br />
              Lost Revenue
            </h3>
            <p className="text-lg text-[#A7B0C0] leading-relaxed">
              In a fast-paced business environment, customers expect immediate responses. Voicemails are ignored, and unanswered callers immediately move to your competitors. 
            </p>
            <p className="text-lg text-[#A7B0C0] leading-relaxed">
              WhatsQuery Voice eliminates missed calls entirely. Our AI receptionist answers within seconds, holds professional conversations, takes orders, qualifies leads, and syncs directly to your ERP.
            </p>
            <div className="pt-4">
              <Link 
                href={onboardingHref}
                className="inline-flex items-center gap-2 text-sm font-black text-[#21D4FD] hover:gap-3 transition-all"
              >
                <span>Calculate your potential savings</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. PRODUCT DEMO SECTION */}
      <section className="py-32 border-t border-white/5 bg-slate-950/10 px-6 relative">
        <div className="mx-auto max-w-5xl text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Interactive Timeline</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              See Every Call Turn Into Action
            </h3>
            <p className="max-w-2xl mx-auto text-[#A7B0C0]">
              From the second the phone rings to the moment your back-office systems are updated—fully automated.
            </p>
          </div>

          <div className="relative border-l-2 border-dashed border-white/10 pl-6 sm:pl-10 space-y-12 text-left max-w-3xl mx-auto">
            {[
              { step: "1", title: "Customer Initiates Call", icon: Phone, desc: "A customer calls your business line. The AI receptionist intercepts and answers within 2 seconds." },
              { step: "2", title: "Natural Conversations", icon: Play, desc: "The AI agent conducts a human-like conversation in English or Urdu, matching your brand's tone." },
              { step: "3", title: "Lead and Intent Qualification", icon: Users, desc: "AI automatically extracts customer details, call reasons, and tags their buying intent." },
              { step: "4", title: "Real-time Booking / Catalog", icon: Calendar, desc: "AI handles table bookings, appointments, or takes orders according to your specific rules." },
              { step: "5", title: "ERP & Systems Sync", icon: Database, desc: "Details are instantly logged into your WhatsQuery ERP database, creating customer records and alerts." }
            ].map((node, idx) => (
              <div key={idx} className="relative group">
                {/* Node indicator badge */}
                <div className="absolute -left-[45px] sm:-left-[61px] top-0 h-10 w-10 rounded-full bg-slate-950 border border-white/10 text-[#21D4FD] flex items-center justify-center font-bold text-sm shadow-lg group-hover:border-[#21D4FD] transition-colors">
                  <node.icon className="h-4 w-4" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white flex items-center gap-3">
                    <span>{node.title}</span>
                    <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[#A7B0C0]">Step {node.step}</span>
                  </h4>
                  <p className="text-sm text-[#A7B0C0] max-w-xl leading-relaxed">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CAPABILITIES SECTION */}
      <section id="features" className="py-32 border-t border-white/5 px-6">
        <div className="mx-auto max-w-7xl space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Core Features</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Enterprise Voice Capabilities
            </h3>
            <p className="max-w-xl mx-auto text-[#A7B0C0]">
              State-of-the-art conversational tools designed to replace legacy answering services completely.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Phone, title: "Answer Every Call", desc: "Seamless low-latency voice handling. Answers calls instantly, handles simultaneous inquiries, and never puts customers on hold." },
              { icon: Users, title: "Capture Every Lead", desc: "Automated intent classification. Extracts caller name, phone number, and conversation summaries to route qualified leads to your sales team." },
              { icon: Calendar, title: "Book Appointments", desc: "Real-time calendar verification. Books consulting slots or restaurant tables directly, enforcing customized booking limits." },
              { icon: Database, title: "ERP System Integration", desc: "Zero manual data entry. Syncs calls, leads, and orders instantly to WhatsQuery ERP, creating structured, actionable tasks." },
              { icon: Globe, title: "Multilingual Support", desc: "Language fluidity. Speaks fluent English, Urdu, and Roman Urdu. Auto-detects caller preferences for maximum customer comfort." },
              { icon: Activity, title: "Voice Operations Center", desc: "Management dashboard. Review call recordings, search transcript logs, configure agent greetings, and edit training FAQs instantly." }
            ].map((cap, idx) => (
              <div 
                key={idx} 
                className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/20 p-8 shadow-xs hover:bg-slate-950/40 hover:border-[#21D4FD]/20 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-[#21D4FD] group-hover:scale-105 transition-transform">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h4 className="mt-6 text-xl font-bold text-white">{cap.title}</h4>
                <p className="mt-3 text-sm text-[#A7B0C0] leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="py-32 border-t border-white/5 bg-slate-950/10 px-6">
        <div className="mx-auto max-w-7xl space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Fast Deployment</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Go Live in Days, Not Months
            </h3>
            <p className="max-w-xl mx-auto text-[#A7B0C0]">
              Our streamlined onboarding ensures your voice agent is trained, mapped, and answering calls almost immediately.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {[
              { step: "01", title: "Connect your number", desc: "Keep your existing phone line. Set up simple conditional call forwarding to your newly assigned WhatsQuery AI number." },
              { step: "02", title: "Configure your agent", desc: "Enter your business hours, pricing list, FAQs, and required greetings. The AI receptionist adapts to your business profile instantly." },
              { step: "03", title: "Go Live & Sync ERP", desc: "Once verified, the receptionist handles all forwarded call volume, creating organized leads and tickets in your dashboard." }
            ].map((item, idx) => (
              <div key={idx} className="space-y-4 text-left">
                <div className="text-6xl font-black text-white/5 tracking-tighter">{item.step}</div>
                <h4 className="text-xl font-bold text-white">{item.title}</h4>
                <p className="text-sm text-[#A7B0C0] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. INDUSTRIES */}
      <section id="solutions" className="py-32 border-t border-white/5 px-6">
        <div className="mx-auto max-w-7xl space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Tailored Solutions</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Built for Every Core Sector
            </h3>
            <p className="max-w-xl mx-auto text-[#A7B0C0]">
              Specialized receptionist models pre-trained on industry workflows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Stethoscope, title: "Healthcare & Clinics", useCase: "Inbound scheduling & triage", outcome: "Saves hours of front-desk booking time" },
              { icon: Utensils, title: "Restaurants & Dining", useCase: "Takeaway order requests & table booking", outcome: "Boosts off-peak table filling rates" },
              { icon: HomeIcon, title: "Real Estate Brokers", useCase: "Leasing lead collection & property tours", outcome: "Ensures no high-value buyer lead is missed" },
              { icon: Scale, title: "Legal & Consulting", useCase: "Intake qualification & callback requests", outcome: "Filters spam and logs active client requests" },
              { icon: Car, title: "Automotive Services", useCase: "Service scheduling & parts inquiry log", outcome: "Streamlines service advisor calendar" },
              { icon: Wrench, title: "Home Care Services", useCase: "Emergency dispatch & job bookings", outcome: "Enables 24/7 lead capture on weekends" }
            ].map((ind, idx) => (
              <div 
                key={idx} 
                className="rounded-3xl border border-white/5 bg-slate-950/20 p-8 space-y-6 hover:border-[#21D4FD]/10 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#21D4FD]">
                  <ind.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">{ind.title}</h4>
                  <div className="text-xs text-[#A7B0C0]">
                    <span className="font-semibold text-white block mb-1">Use Case:</span>
                    {ind.useCase}
                  </div>
                  <div className="text-xs text-[#A7B0C0]">
                    <span className="font-semibold text-white block mb-1">Outcome:</span>
                    {ind.outcome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ENTERPRISE SECTION */}
      <section id="enterprise" className="py-32 border-t border-white/5 bg-slate-950/20 px-6">
        <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-12 lg:items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Secure Infrastructure</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Built for Enterprise <br />
              Deployment
            </h3>
            <p className="text-[#A7B0C0] leading-relaxed">
              WhatsQuery Voice satisfies the most stringent global data management and security standards, offering flexible options for enterprise scaling.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 pt-4">
              {[
                { icon: ShieldCheck, title: "Private VPS Deployment", desc: "Run your voice agent nodes on isolated cloud resources." },
                { icon: Lock, title: "Data Ownership", desc: "We process the data, but your records and logs belong solely to you." },
                { icon: Key, title: "Role-Based Access Control", desc: "Fine-grained permissions for administrators and front-desk agents." },
                { icon: FileText, title: "Comprehensive Audit Logs", desc: "Track every configuration change and prompt synchronization." }
              ].map((ent, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <ent.icon className="h-4 w-4 text-[#21D4FD]" />
                    <span>{ent.title}</span>
                  </h4>
                  <p className="text-xs text-[#A7B0C0] leading-relaxed">{ent.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secure lock visual right */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="h-72 w-72 rounded-[48px] border border-white/5 bg-gradient-to-tr from-[#21D4FD]/5 to-indigo-500/10 flex items-center justify-center relative shadow-2xl">
              <div className="absolute inset-4 rounded-[36px] border border-[#21D4FD]/10 bg-slate-950 flex items-center justify-center">
                <Shield className="h-24 w-24 text-[#21D4FD] animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 9.5 PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 border-t border-white/5">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Simple Pricing</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Plans for Every Stage
            </h3>
            <p className="max-w-xl mx-auto text-[#A7B0C0]">
              Transparent pricing with no hidden fees. Upgrade as your call volume grows.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-[32px] border border-white/10 bg-slate-900/50 p-8 flex flex-col hover:border-[#21D4FD]/30 transition-all">
              <h4 className="text-2xl font-black text-white">Starter</h4>
              <p className="text-sm text-slate-400 mt-2 min-h-[40px]">Perfect for small businesses getting started</p>
              <div className="mt-6 mb-8">
                <div className="text-4xl font-black text-white">PKR 15,000</div>
                <div className="text-sm text-slate-400 mt-1">/month</div>
              </div>
              <ul className="space-y-4 flex-1 text-sm text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 1,500 minutes per month</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 1 phone number</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Custom greeting</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Appointment scheduling</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Call analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 24/7 call handling</li>
              </ul>
              <Link href={onboardingHref} className="mt-8 block w-full py-3 rounded-xl border border-white/20 text-center font-bold text-white hover:bg-white/5 transition-all">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="rounded-[32px] border border-[#21D4FD]/50 bg-gradient-to-b from-[#21D4FD]/10 to-transparent p-8 flex flex-col relative shadow-2xl shadow-[#21D4FD]/10 transform md:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#21D4FD] text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>
              <h4 className="text-2xl font-black text-white">Pro</h4>
              <p className="text-sm text-slate-400 mt-2 min-h-[40px]">For businesses with advanced needs</p>
              <div className="mt-6 mb-8">
                <div className="text-4xl font-black text-white">PKR 55,000</div>
                <div className="text-sm text-slate-400 mt-1">/month</div>
              </div>
              <ul className="space-y-4 flex-1 text-sm text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 7,000 minutes per month</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 2 phone numbers</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Custom greeting</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Appointment scheduling</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Advanced analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Multi-language support (20+)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Voice options (premium)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Priority support</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 24/7 call handling</li>
              </ul>
              <Link href={onboardingHref} className="mt-8 block w-full py-3 rounded-xl bg-[#21D4FD] text-center font-bold text-slate-950 hover:opacity-90 transition-all">Get Started</Link>
            </div>

            {/* Growth */}
            <div className="rounded-[32px] border border-white/10 bg-slate-900/50 p-8 flex flex-col hover:border-[#21D4FD]/30 transition-all">
              <h4 className="text-2xl font-black text-white">Growth</h4>
              <p className="text-sm text-slate-400 mt-2 min-h-[40px]">Ideal for growing businesses</p>
              <div className="mt-6 mb-8">
                <div className="text-4xl font-black text-white">PKR 35,000</div>
                <div className="text-sm text-slate-400 mt-1">/month</div>
              </div>
              <ul className="space-y-4 flex-1 text-sm text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 3,500 minutes per month</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 1 phone number</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Custom greeting</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Appointment scheduling</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Advanced analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Multi-language support (5+)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> Chat + email support</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#21D4FD]" /> 24/7 call handling</li>
              </ul>
              <Link href={onboardingHref} className="mt-8 block w-full py-3 rounded-xl border border-white/20 text-center font-bold text-white hover:bg-white/5 transition-all">Get Started</Link>
            </div>

          </div>
          
          <p className="text-center text-xs text-slate-500">*Prices are exclusive of tax</p>
        </div>
      </section>

      {/* 10. METRICS SECTION */}
      <section className="py-32 border-t border-white/5 px-6">
        <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { val: "90%", desc: "Faster Response Times" },
            { val: "24/7", desc: "Availability Guaranteed" },
            { val: "70%", desc: "Lower Call Costs" },
            { val: "< 7 Days", desc: "Deployment Time" }
          ].map((metric, idx) => (
            <div key={idx} className="text-center space-y-2 border-r border-white/5 last:border-0 py-6">
              <div className="text-6xl lg:text-7xl font-extrabold text-[#21D4FD] tracking-tighter">{metric.val}</div>
              <div className="text-sm font-semibold text-white uppercase tracking-wider">{metric.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="py-32 border-t border-white/5 bg-gradient-to-b from-[#050816] to-[#070b24] px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[300px] bg-[#21D4FD]/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="mx-auto max-w-4xl space-y-8 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Turn Every Phone Call <br />
            Into Revenue
          </h2>
          <p className="max-w-xl mx-auto text-lg text-[#A7B0C0] leading-relaxed">
            Deploy a custom AI receptionist tailored specifically to your brand guidelines and system integrations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={onboardingHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#21D4FD] px-8 py-4 text-sm font-black text-[#050816] shadow-lg shadow-[#21D4FD]/20 hover:scale-[1.03] transition-all"
            >
              Book a Demo
            </Link>
            <Link 
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#050816] text-[#A7B0C0] text-sm px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-md border border-white/20 flex items-center justify-center">
              <img src="/logo-emblem.png" alt="WhatsQuery Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="font-bold text-white">WhatsQuery Voice</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} WhatsQuery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
