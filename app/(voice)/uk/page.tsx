import type { Metadata } from "next";

import { VoiceMarketPage } from "@/components/voice/voice-market-page";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

export const metadata: Metadata = {
  title: "WhatsQuery Voice UK",
  description: "UK-focused AI receptionist, booking assistant, and call automation for WhatsQuery Voice.",
  alternates: {
    canonical: "/uk",
    languages: {
      "en-GB": "/uk",
      "en-PK": "/pk",
    },
  },
};

export default async function UkMarketPage() {
  const host = await getVoiceRequestHost();

  return (
    <VoiceMarketPage
      marketKey="uk"
      homeHref={toVoiceExternalPath("/uk", host)}
      loginHref={toVoiceExternalPath("/login", host)}
      onboardingHref={toVoiceExternalPath("/onboarding", host)}
      pricingHref={toVoiceExternalPath("/uk/pricing", host)}
      docsHref={toVoiceExternalPath("/docs", host)}
      marketSwitcherHref={toVoiceExternalPath("/pk", host)}
    />
  );
}
