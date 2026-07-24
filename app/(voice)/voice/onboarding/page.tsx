import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { SmartVoiceOnboardingForm } from "@/components/voice/smart-voice-onboarding-form";
import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getVoiceOnboardingData } from "@/modules/voice/service";

export default async function VoiceOnboardingPage() {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const pricingHref = toVoiceExternalPath("/pricing", host);
  const docsHref = toVoiceExternalPath("/docs", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  if (!isAuthenticated) {
    redirect(`${loginHref}?callbackUrl=${encodeURIComponent(toVoiceExternalPath("/onboarding", host))}`);
  }
  
  let businessProfile = null;
  let receptionistSettings = null;
  let organization = null;

  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const data = await getVoiceOnboardingData(ctx.organizationId);
  businessProfile = data.businessProfile;
  receptionistSettings = data.receptionistSettings;
  organization = data.organization;

  return (
    <VoiceMarketingShell
      homeHref={homeHref}
      loginHref={loginHref}
      onboardingHref={toVoiceExternalPath("/onboarding", host)}
      pricingHref={pricingHref}
      docsHref={docsHref}
    >
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-16">
        <SmartVoiceOnboardingForm
          dashboardHref={dashboardHref}
          isAuthenticated={isAuthenticated}
          initialValues={{
            businessName: businessProfile?.businessName ?? organization?.name ?? "",
            industry: businessProfile?.industry ?? organization?.industryType ?? "",
            website: businessProfile?.website ?? "",
            preferredCallingCountry:
              (organization?.country as "PK" | "US" | "GB" | undefined) ?? "PK",
            businessPhone: businessProfile?.businessPhone ?? organization?.phone ?? "",
            preferredLanguage:
              (businessProfile?.preferredLanguage as "ENGLISH" | "URDU" | "ROMAN_URDU" | "AUTO_DETECT" | undefined) ??
              (receptionistSettings?.languageMode as "ENGLISH" | "URDU" | "ROMAN_URDU" | "AUTO_DETECT" | undefined) ??
              "AUTO_DETECT",
            openingHours: businessProfile?.openingHours ?? receptionistSettings?.businessHours ?? "",
            mainGoal:
              (businessProfile?.mainGoal as "ANSWER_FAQS" | "CAPTURE_LEADS" | "BOOK_APPOINTMENTS" | "ROUTE_CALLS" | undefined) ??
              "ANSWER_FAQS",
            fallbackContactMethod:
              (businessProfile?.fallbackContactMethod as "WHATSAPP" | "SMS" | "EMAIL" | "HUMAN_TRANSFER" | "NONE" | undefined) ??
              "WHATSAPP",
            greetingMessage: businessProfile?.greetingMessage ?? receptionistSettings?.greetingMessage ?? "",
          }}
        />
      </main>
    </VoiceMarketingShell>
  );
}
