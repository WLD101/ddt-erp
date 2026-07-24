import type { Metadata } from "next";

import { VoiceMarketPage } from "@/components/voice/voice-market-page";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

export const metadata: Metadata = {
  title: "WhatsQuery Voice Pakistan",
  description: "Pakistan-focused voice, WhatsApp, and business-operations funnel for WhatsQuery Voice.",
  alternates: {
    canonical: "/pk",
    languages: {
      "en-PK": "/pk",
      "en-GB": "/uk",
    },
  },
};

export default async function PkMarketPage() {
  const host = await getVoiceRequestHost();

  return (
    <VoiceMarketPage
      marketKey="pk"
      homeHref={toVoiceExternalPath("/pk", host)}
      loginHref={toVoiceExternalPath("/login", host)}
      onboardingHref={toVoiceExternalPath("/onboarding", host)}
      pricingHref={toVoiceExternalPath("/pk/pricing", host)}
      docsHref={toVoiceExternalPath("/docs", host)}
      marketSwitcherHref={toVoiceExternalPath("/uk", host)}
    />
  );
}
