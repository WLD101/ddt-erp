"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Sparkles, Building2, Clock, Bot, Calendar, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllowedVoiceLanguageModesForCountry } from "@/modules/voice/country-policy";
import { saveVoiceBusinessProfileAction } from "@/modules/voice/actions";
import { voiceBusinessProfileSchema, voiceGoalOptions, voiceFallbackContactOptions } from "@/modules/voice/schema";

type VoiceBusinessProfileValues = z.input<typeof voiceBusinessProfileSchema>;

const GREETING_POOL = {
  ENGLISH: {
    general: [
      "Hello, thank you for calling {businessName}! I am your AI receptionist. How can I help you today?",
      "Hi there! You've reached {businessName}. This is our AI assistant. Let me know how I can help you.",
      "Thank you for calling {businessName}. I'm here to answer your questions and assist you. How can I help?"
    ],
    medical: [
      "Hello, thank you for calling {businessName}! If you have a medical emergency, please call 911 immediately. Otherwise, how can I assist you with appointments or inquiries today?",
      "Welcome to {businessName} clinic. I can assist you with scheduling, location info, or leaving a message. How may I help you today?",
      "Hi, you've reached the office of {businessName}. How can I assist you with your booking, prescription request, or clinic hours?"
    ],
    restaurant: [
      "Hi there! Welcome to {businessName}. I can help you with reservations, order requests, or opening hours. What can I get started for you today?",
      "Hello, thank you for calling {businessName}. Are you looking to book a table, place a takeout order, or check our menu? I'd be happy to help!",
      "Welcome to {businessName}! I am your automated assistant. How can I help you with your dining, ordering, or event inquiry today?"
    ],
    salon: [
      "Hi! Thank you for calling {businessName} salon. Ready for a fresh look? I can help you book an appointment or answer questions. How can I help you today?",
      "Welcome to {businessName}. I can assist you in booking a stylist, checking our services, or pricing details. What can we do for you today?",
      "Hello, thank you for calling {businessName} spa and salon. How can I help you schedule your next pampering session?"
    ],
    real_estate: [
      "Hello, thank you for calling {businessName} real estate. How can I help you find your dream property or connect you with an agent today?",
      "Hi! You've reached {businessName} properties. I can assist you with buying, selling, or booking a property viewing. How can I help you?",
      "Welcome to {businessName}. Interested in our new listings or want to speak to a broker? Let me know how I can assist you today."
    ],
    ecommerce: [
      "Hi! Welcome to {businessName} customer care. How can I assist you with your orders, tracking, or product questions today?",
      "Hello, thank you for contacting {businessName}. I am your automated order assistant. How can I help you with your order status or refunds?",
      "Thank you for calling {businessName} support. Let me know if you have questions about products, shipping, or returns."
    ]
  },
  URDU: {
    general: [
      "السلام علیکم! {businessName} میں خوش آمدید۔ میں آپ کا اے آئی ریسیپشنسٹ ہوں۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟",
      "ہیلو! {businessName} میں کال کرنے کا شکریہ۔ میں آپ کا اسسٹنٹ ہوں۔ بتائیے میں آپ کی کیا مدد کروں؟",
      "السلام علیکم! آپ نے {businessName} میں رابطہ کیا ہے۔ میں معلومات فراہم کرنے کے لیے حاضر ہوں۔ کیسے مدد کروں؟"
    ],
    medical: [
      "السلام علیکم! {businessName} میں خوش آمدید۔ اگر کوئی ہنگامی طبی صورتحال ہے تو متعلقہ نمبر پر رابطہ کریں۔ ورنہ، میں آپ کی اپائنٹمنٹ اور معلومات کے لیے حاضر ہوں۔",
      "ہیلو، {businessName} کلینک میں خوش آمدید۔ اپائنٹمنٹ بک کرنے یا ڈاکٹر کی دستیابی جاننے کے لیے بتائیے، میں آپ کی کیا مدد کر سکتا ہوں؟",
      "السلام علیکم! آپ نے {businessName} کلینک میں رابطہ کیا ہے۔ دوا کی پرچی، ٹیسٹ رپورٹ یا چک اپ کے وقت کے بارے میں کیا معلومات چاہیے؟"
    ],
    restaurant: [
      "السلام علیکم! {businessName} میں خوش آمدید۔ میں آپ کی بکنگ یا آرڈر کی تیاری میں مدد کر سکتا ہوں۔ آج آپ کیا آرڈر کرنا چاہیں گے؟",
      "ہیلو، {businessName} ریستوراں میں خوش آمدید۔ کیا آپ ٹیبل بک کروانا چاہتے ہیں یا کوئی ہوم ڈلیوری آرڈر دینا چاہتے ہیں؟",
      "خوش آمدید! آپ نے {businessName} فوڈز میں کال کی ہے۔ مینو کی تفصیلات یا ہوم ڈلیوری کے لیے بتائیے، میں کیسے مدد کروں؟"
    ],
    salon: [
      "السلام علیکم! {businessName} سیلون میں خوش آمدید۔ میں آپ کی بیوٹی سروسز کی بکنگ میں مدد کے لیے حاضر ہوں۔ میں آپ کی کیا مدد کروں؟",
      "ہیلو، {businessName} بیوٹی لاؤنج میں خوش آمدید۔ ہیئر کٹ، فیشل یا دیگر سروسز کی بکنگ کے لیے بتائیے، میں حاضر ہوں۔",
      "السلام علیکم! {businessName} میں خوش آمدید۔ آپ کا اپائنٹمنٹ کس وقت بک کرنا ہے؟ میں آپ کی مدد کے لیے تیار ہوں۔"
    ],
    real_estate: [
      "السلام علیکم! {businessName} رئیل اسٹیٹ میں خوش آمدید۔ میں پراپرٹی کی خرید و فروخت یا معلومات کے لیے آپ کی کیا مدد کر سکتا ہوں؟",
      "ہیلو! {businessName} پراپرٹیز میں خوش آمدید۔ کیا آپ پلاٹ، مکان یا دکان کی تفصیلات جاننا چاہتے ہیں؟ بتائیے میں کیسے مدد کروں؟",
      "السلام علیکم! آپ نے {businessName} اسٹیٹ ایجنسی میں رابطہ کیا ہے۔ نئے پروجیکٹس کی بکنگ یا وزٹ کے لیے بتائیے، میں حاضر ہوں۔"
    ],
    ecommerce: [
      "السلام علیکم! {businessName} کسٹمر سروس میں خوش آمدید۔ میں آپ کے آرڈرز اور مصنوعات کی تفصیلات کے بارے میں کیا مدد کر سکتا ہوں؟",
      "ہیلو! {businessName} آن لائن اسٹور میں خوش آمدید۔ آپ کو اپنے آرڈر کا اسٹیٹس جاننا ہے یا پروڈکٹ کی واپسی کے بارے میں معلومات چاہیے؟",
      "السلام علیکم! {businessName} سپورٹ میں خوش آمدید۔ کسی بھی پروڈکٹ یا ڈلیوری کے سوال کے لیے بتائیے، میں حاضر ہوں۔"
    ]
  },
  ROMAN_URDU: {
    general: [
      "Assalam-o-Alaikum! {businessName} me khush-aamdeed. Main aapka AI receptionist hoon. Aaj main aapki kya madad kar sakta hoon?",
      "Hi! {businessName} me call karne ka shukriya. Main aapka assistant hoon. Bataiye aapki kya help karoon?",
      "Assalam-o-Alaikum! Aapne {businessName} me rabta kiya hai. Main details dene ke liye haazir hoon. Kaise help karoon?"
    ],
    medical: [
      "Assalam-o-Alaikum! {businessName} clinic me khush-aamdeed. Agar koi medical emergency hai to please hospital call karein. Appointment book karne ya details ke liye main aapki kya madad karoon?",
      "Hello, {businessName} clinic me khush-aamdeed. Appointment book karne ya doctor ki availability check karne ke liye batayein, kaise help karoon?",
      "Assalam-o-Alaikum! Aapne {businessName} doctor's office call kiya hai. Appointment schedule karne ke liye main aapki kya help karoon?"
    ],
    restaurant: [
      "Hi! {businessName} restaurant me khush-aamdeed. Main aapki table reservation ya order placement me help kar sakta hoon. Aaj aap kya pasand karenge?",
      "Assalam-o-Alaikum! {businessName} me call karne ka shukriya. Kya aap koi table book karna chahte hain ya delivery order dena chahte hain?",
      "Welcome to {businessName}! Main aapki order request ya timings details check karne me help kar sakta hoon. Bataiye kaise help karoon?"
    ],
    salon: [
      "Assalam-o-Alaikum! {businessName} salon me khush-aamdeed. Haircut ya facial appointment book karne ke liye main haazir hoon. Kaise help karoon aapki?",
      "Hi! {businessName} salon and spa me khush-aamdeed. Service booking ya pricing details ke liye batayein, kaise help karoon?",
      "Assalam-o-Alaikum! {businessName} me call karne ka shukriya. Hair stylist booking ke liye main aapki kya help karoon?"
    ],
    real_estate: [
      "Assalam-o-Alaikum! {businessName} real estate me khush-aamdeed. Property buy/sell karne ya plots ki details ke liye main aapki kya help kar sakta hoon?",
      "Hi! You've reached {businessName} properties. Plot, house ya commercial space ki bookings aur details ke liye bataiye, kaise help karoon?",
      "Assalam-o-Alaikum! {businessName} estate agency me khush-aamdeed. New properties ke rates aur viewings ke liye main haazir hoon."
    ],
    ecommerce: [
      "Hi! {businessName} customer care me khush-aamdeed. Apne order status ya product exchange ke bare me poochne ke liye bataiye, main kaise help karoon?",
      "Hello, thank you for calling {businessName} online store. Order details, shipping status ya returns ke liye batayein, main haazir hoon.",
      "Assalam-o-Alaikum! {businessName} support me khush-aamdeed. Kisi product ya delivery issue ke baare me bataiye, kaise help karoon?"
    ]
  }
} as const;

function getBusinessNiche(industryText?: string) {
  const normalized = (industryText || "").toLowerCase();
  if (normalized.includes("clinic") || normalized.includes("dent") || normalized.includes("med") || normalized.includes("doc") || normalized.includes("health") || normalized.includes("hosp")) {
    return "medical";
  }
  if (normalized.includes("rest") || normalized.includes("cafe") || normalized.includes("food") || normalized.includes("pizza") || normalized.includes("bake") || normalized.includes("din")) {
    return "restaurant";
  }
  if (normalized.includes("salon") || normalized.includes("spa") || normalized.includes("hair") || normalized.includes("beaut") || normalized.includes("nail")) {
    return "salon";
  }
  if (normalized.includes("estate") || normalized.includes("prop") || normalized.includes("agent") || normalized.includes("hous") || normalized.includes("land")) {
    return "real_estate";
  }
  if (normalized.includes("store") || normalized.includes("shop") || normalized.includes("retail") || normalized.includes("ecom") || normalized.includes("buy")) {
    return "ecommerce";
  }
  return "general";
}

const selectClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-sm outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50";

const inputClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-sm outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50";

type Props = {
  initialValues: Partial<VoiceBusinessProfileValues>;
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
  const industry = useWatch({ control, name: "industry" }) || "";
  const preferredCallingCountry = useWatch({ control, name: "preferredCallingCountry" }) || "PK";
  const preferredLanguage = useWatch({ control, name: "preferredLanguage" }) || "ENGLISH";
  const availableLanguageModes = getAllowedVoiceLanguageModesForCountry(preferredCallingCountry);

  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const rotateGreeting = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);

    const lang = preferredLanguage;
    const niche = getBusinessNiche(industry);
    const name = businessName || "our business";

    let pool: string[] = [];
    if (lang === "ENGLISH" || lang === "ROMAN_ENGLISH") {
      pool = [...GREETING_POOL.ENGLISH[niche]];
    } else if (lang === "URDU") {
      pool = [...GREETING_POOL.URDU[niche]];
    } else if (lang === "ROMAN_URDU" || lang === "MIXED_ROMAN_URDU_ENGLISH") {
      pool = [...GREETING_POOL.ROMAN_URDU[niche]];
    } else {
      // AUTO_DETECT - combine all
      pool = [
        GREETING_POOL.ENGLISH[niche][0],
        GREETING_POOL.ROMAN_URDU[niche][0],
        GREETING_POOL.URDU[niche][0],
        GREETING_POOL.ENGLISH[niche][1],
        GREETING_POOL.ROMAN_URDU[niche][1],
        GREETING_POOL.URDU[niche][1],
        GREETING_POOL.ENGLISH[niche][2],
        GREETING_POOL.ROMAN_URDU[niche][2],
        GREETING_POOL.URDU[niche][2],
      ];
    }

    const nextIndex = (greetingIndex + 1) % pool.length;
    setGreetingIndex(nextIndex);
    const selectedTemplate = pool[nextIndex];
    const greetingText = selectedTemplate.replace(/{businessName}/g, name);
    setValue("greetingMessage", greetingText, { shouldValidate: true });
  };

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) fieldsToValidate = ["businessName", "industry", "website"];
    if (currentStep === 1) fieldsToValidate = ["preferredCallingCountry", "businessPhone", "openingHours"];
    
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
      
      const isVoiceHost = window.location.hostname.startsWith("voice.") || window.location.hostname === "voice.localhost";
      const signupPath = isVoiceHost ? "/auth/signup" : "/voice/auth/signup";
      router.push(`${signupPath}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
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

                <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Calling Country</Label>
                    <select {...register("preferredCallingCountry")} className={selectClassName} disabled={isPending}>
                      <option value="GB">United Kingdom (+44)</option>
                      <option value="PK">Pakistan (+92)</option>
                    </select>
                    {errors.preferredCallingCountry && <p className="text-xs text-rose-400">{errors.preferredCallingCountry.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Phone</Label>
                    <Input {...register("businessPhone")} className={inputClassName} disabled={isPending} placeholder="+923001234567" />
                    {errors.businessPhone && <p className="text-xs text-rose-400">{errors.businessPhone.message}</p>}
                  </div>
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
                      {availableLanguageModes.map(opt => <option key={opt} value={opt}>{opt.replaceAll("_", " ")}</option>)}
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
                    <div className="flex flex-col">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Greeting Message</Label>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Selected Niche: <span className="text-cyan-400 capitalize">{getBusinessNiche(industry)}</span>
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={rotateGreeting} 
                      disabled={isPending}
                      className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
                      Switch Suggestion
                    </button>
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
