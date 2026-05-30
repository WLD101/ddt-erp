import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceOnboardingForm } from "@/components/voice/voice-onboarding-form";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getVoiceOnboardingData } from "@/modules/voice/service";

export default async function VoiceOnboardingPage() {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`${loginHref}?callbackUrl=${encodeURIComponent(toVoiceExternalPath("/onboarding", host))}`);
  }

  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const { businessProfile, receptionistSettings } = await getVoiceOnboardingData(ctx.organizationId);

  return (
    <VoiceMarketingShell homeHref={homeHref} loginHref={loginHref} onboardingHref={toVoiceExternalPath("/onboarding", host)}>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 max-w-4xl">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Business onboarding</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Set up the receptionist before live calls exist</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This onboarding is now real and database-backed. It stores the core business profile that the future AI receptionist will use for tone, goals, and caller handling rules.
          </p>
        </div>

        <VoiceOnboardingForm
          dashboardHref={dashboardHref}
          initialValues={{
            businessName: businessProfile?.businessName ?? "",
            industry: businessProfile?.industry ?? "",
            website: businessProfile?.website ?? "",
            businessPhone: businessProfile?.businessPhone ?? "",
            preferredLanguage:
              (businessProfile?.preferredLanguage as "ENGLISH" | "URDU" | "ROMAN_URDU" | "AUTO_DETECT" | undefined) ??
              (receptionistSettings?.languageMode as "ENGLISH" | "URDU" | "ROMAN_URDU" | "AUTO_DETECT" | undefined) ??
              "AUTO_DETECT",
            openingHours: businessProfile?.openingHours ?? receptionistSettings?.businessHours ?? "",
            mainGoal:
              (businessProfile?.mainGoal as "ANSWER_FAQS" | "CAPTURE_LEADS" | "BOOK_APPOINTMENTS" | "ROUTE_CALLS" | undefined) ??
              "ANSWER_FAQS",
            fallbackContactMethod: businessProfile?.fallbackContactMethod ?? "",
            greetingMessage: businessProfile?.greetingMessage ?? receptionistSettings?.greetingMessage ?? "",
          }}
        />
      </main>
    </VoiceMarketingShell>
  );
}
