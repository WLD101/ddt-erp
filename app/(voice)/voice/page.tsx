import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { VoiceLandingPageClient } from "@/components/voice/voice-landing-page-client";

export default async function VoiceLandingPage() {
  const host = await getVoiceRequestHost();
  const loginHref = toVoiceExternalPath("/login", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);
  const dashboardHref = toVoiceExternalPath("/dashboard", host);

  return (
    <VoiceLandingPageClient
      loginHref={loginHref}
      onboardingHref={onboardingHref}
      dashboardHref={dashboardHref}
    />
  );
}
