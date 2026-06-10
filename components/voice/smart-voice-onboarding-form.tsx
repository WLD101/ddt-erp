"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Sparkles, Building2, Clock, Bot, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceBusinessProfileAction } from "@/modules/voice/actions";
import { voiceBusinessProfileSchema, voiceGoalOptions, voiceLanguageOptions, voiceFallbackContactOptions } from "@/modules/voice/schema";

type VoiceBusinessProfileValues = z.input<typeof voiceBusinessProfileSchema>;

const selectClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-sm outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50";

const inputClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-sm outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50";

type Props = {
  initialValues: VoiceBusinessProfileValues;
  dashboardHref: string;
  isAuthenticated: boolean;
};

const STEPS = [
  { id: "identity", title: "Business Identity", icon: Building2 },
  { id: "operations", title: "Operations & Hours", icon: Clock },
  { id: "agent", title: "AI Agent Setup", icon: Bot },
];

function SmartHoursSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Parse existing string or use defaults
  const [schedule, setSchedule] = useState<Record<string, { open: boolean, start: string, end: string }>>(() => {
    const defaultSchedule = days.reduce((acc, day) => ({
      ...acc,
      [day]: { open: !["Sat", "Sun"].includes(day), start: "09:00", end: "17:00" }
    }), {});
    return defaultSchedule;
  });

  const updateSchedule = () => {
    const activeDays = days.filter(d => schedule[d].open);
    if (activeDays.length === 0) {
      onChange("Closed");
      return;
    }
    
    // Group similar times (simplified)
    const formatted = days.map(d => {
      const s = schedule[d];
      return s.open ? `${d} ${s.start}-${s.end}` : `${d} Closed`;
    }).join(", ");
    
    onChange(formatted);
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));
  };

  const changeTime = (day: string, field: "start" | "end", val: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  // Run update when schedule changes
  useEffect(() => {
    updateSchedule();
  }, [schedule]);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Smart Calendar</span>
      </div>
      {days.map(day => {
        const s = schedule[day];
        return (
          <div key={day} className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => toggleDay(day)}
              className={`w-14 py-1.5 rounded-lg text-xs font-bold transition-all ${s.open ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"}`}
            >
              {day}
            </button>
            
            {s.open ? (
              <div className="flex items-center gap-2 flex-1">
                <input 
                  type="time" 
                  value={s.start} 
                  onChange={(e) => changeTime(day, "start", e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-slate-500 text-sm">to</span>
                <input 
                  type="time" 
                  value={s.end} 
                  onChange={(e) => changeTime(day, "end", e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            ) : (
              <div className="flex-1 text-sm text-slate-500 italic">Closed</div>
            )}
          </div>
        )
      })}
    </div>
  );
}

export function SmartVoiceOnboardingForm({ initialValues, dashboardHref, isAuthenticated }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<VoiceBusinessProfileValues>({
    resolver: zodResolver(voiceBusinessProfileSchema),
    defaultValues: initialValues,
  });

  const businessName = useWatch({ control, name: "businessName" });
  const openingHours = useWatch({ control, name: "openingHours" });

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) fieldsToValidate = ["businessName", "industry", "website"];
    if (currentStep === 1) fieldsToValidate = ["businessPhone", "openingHours"];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => setCurrentStep(prev => Math.max(0, prev - 1));

  const onSubmit = (values: VoiceBusinessProfileValues) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("voice_pending_onboarding", JSON.stringify(values));
      toast.success("Progress saved! Please sign up to finalize your AI receptionist setup.");
      router.push(`/auth/signup?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      const result = await saveVoiceBusinessProfileAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      sessionStorage.removeItem("voice_pending_onboarding");
      toast.success("Voice setup complete!");
      router.push(dashboardHref);
    });
  };

  const applyGreetingSuggestion = (type: "friendly" | "formal" | "direct") => {
    const name = businessName || "our business";
    const templates = {
      friendly: `Hi there! Thanks for calling ${name}. I'm your AI assistant. How can I brighten your day and help you?`,
      formal: `Welcome to ${name}. You have reached our automated receptionist. Please let me know the reason for your call so I may assist you.`,
      direct: `Hello, you've reached ${name}. How can I help you today?`
    };
    setValue("greetingMessage", templates[type], { shouldValidate: true });
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto min-h-[600px]">
      {/* Sidebar Progress */}
      <div className="md:w-64 shrink-0 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">Setup Assistant</h2>
          <p className="text-xs text-slate-400 leading-relaxed">We pulled your info from signup. Please confirm or update it to train your AI.</p>
        </div>
        
        <div className="space-y-1">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isPast = currentStep > idx;
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-cyan-500/10 border border-cyan-500/20" : "border border-transparent"}`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? "bg-cyan-500 text-slate-950" : isPast ? "bg-white/10 text-white" : "bg-white/5 text-slate-600"}`}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-bold ${isActive ? "text-cyan-400" : isPast ? "text-slate-300" : "text-slate-600"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 rounded-3xl border border-white/10 bg-slate-900/50 p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex-1"
              >
                <div className="space-y-1 mb-8">
                  <h3 className="text-2xl font-black text-white">Confirm Business Identity</h3>
                  <p className="text-sm text-slate-400">We pre-filled this from your signup. Change it if you like!</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Name</Label>
                  <Input {...register("businessName")} className={inputClassName} disabled={isPending} />
                  {errors.businessName && <p className="text-xs text-rose-400">{errors.businessName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Industry</Label>
                  <Input {...register("industry")} className={inputClassName} disabled={isPending} placeholder="e.g. Dental clinic, Law firm" />
                  {errors.industry && <p className="text-xs text-rose-400">{errors.industry.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Website <span className="text-slate-600">(Optional)</span></Label>
                  <Input {...register("website")} className={inputClassName} disabled={isPending} placeholder="https://..." />
                  {errors.website && <p className="text-xs text-rose-400">{errors.website.message}</p>}
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex-1"
              >
                <div className="space-y-1 mb-8">
                  <h3 className="text-2xl font-black text-white">Operations & Hours</h3>
                  <p className="text-sm text-slate-400">When should your AI tell customers you are open?</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Phone</Label>
                  <Input {...register("businessPhone")} className={inputClassName} disabled={isPending} placeholder="+1..." />
                  {errors.businessPhone && <p className="text-xs text-rose-400">{errors.businessPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Opening Hours</Label>
                  <SmartHoursSelector 
                    value={openingHours} 
                    onChange={(val) => setValue("openingHours", val, { shouldValidate: true })} 
                  />
                  {/* Hidden input to track validation */}
                  <input type="hidden" {...register("openingHours")} />
                  {errors.openingHours && <p className="text-xs text-rose-400">{errors.openingHours.message}</p>}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex-1"
              >
                <div className="space-y-1 mb-8">
                  <h3 className="text-2xl font-black text-white">AI Agent Behavior</h3>
                  <p className="text-sm text-slate-400">How should your agent greet and handle callers?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</Label>
                    <select {...register("preferredLanguage")} className={selectClassName} disabled={isPending}>
                      {voiceLanguageOptions.map(opt => <option key={opt} value={opt}>{opt.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Main Goal</Label>
                    <select {...register("mainGoal")} className={selectClassName} disabled={isPending}>
                      {voiceGoalOptions.map(opt => <option key={opt} value={opt}>{opt.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Fallback Method</Label>
                  <select {...register("fallbackContactMethod")} className={selectClassName} disabled={isPending}>
                    {voiceFallbackContactOptions.map(opt => <option key={opt} value={opt}>{opt.replace("_", " ")}</option>)}
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Greeting Message</Label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => applyGreetingSuggestion("friendly")} className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3"/> Friendly</button>
                      <button type="button" onClick={() => applyGreetingSuggestion("formal")} className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 hover:bg-indigo-400/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3"/> Formal</button>
                    </div>
                  </div>
                  <Textarea {...register("greetingMessage")} className={`${inputClassName} min-h-[100px] resize-none`} disabled={isPending} />
                  {errors.greetingMessage && <p className="text-xs text-rose-400">{errors.greetingMessage.message}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0 || isPending}
              className="text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-8 rounded-xl"
              >
                Continue <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold px-8 rounded-xl"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Save & Launch
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
