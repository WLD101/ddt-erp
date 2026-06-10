import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentTenantContext } from "@/lib/tenant";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { StripeCheckoutLauncher } from "@/components/billing/stripe-checkout-launcher";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function VoicePricingPage() {
  const session = await auth();
  const host = await getVoiceRequestHost();

  if (!session?.user?.id) {
    redirect(toVoiceExternalPath("/login", host));
  }

  const ctx = await getCurrentTenantContext();
  
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { accessStatus: true },
  });

  if (org?.accessStatus === "active") {
    redirect(toVoiceExternalPath("/dashboard", host));
  }

  const loginHref = toVoiceExternalPath("/login", host);
  const homeHref = toVoiceExternalPath("/", host);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref="#">
      <main className="mx-auto max-w-7xl px-4 py-16 md:py-32 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-[#21D4FD] font-black">Final Step</h2>
          <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Activate Your 14-Day Free Trial
          </h3>
          <p className="max-w-xl mx-auto text-[#A7B0C0]">
            Select a plan to complete your setup. <strong className="text-white">You won&apos;t be charged today.</strong> Cancel anytime within 14 days.
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
            <div className="mt-8 pt-6 border-t border-white/10">
              <StripeCheckoutLauncher
                planId="starter"
                planName="Starter"
                availableCycles={{ monthly: true, yearly: false }}
                trialPeriodDays={14}
                ctaLabel="Start 14-Day Free Trial"
              />
            </div>
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
            </ul>
            <div className="mt-8 pt-6 border-t border-white/10">
              <StripeCheckoutLauncher
                planId="pro"
                planName="Pro"
                availableCycles={{ monthly: true, yearly: false }}
                trialPeriodDays={14}
                ctaLabel="Start 14-Day Free Trial"
              />
            </div>
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
            </ul>
            <div className="mt-8 pt-6 border-t border-white/10">
              <StripeCheckoutLauncher
                planId="business"
                planName="Growth"
                availableCycles={{ monthly: true, yearly: false }}
                trialPeriodDays={14}
                ctaLabel="Start 14-Day Free Trial"
              />
            </div>
          </div>
        </div>
      </main>
    </VoiceMarketingShell>
  );
}
