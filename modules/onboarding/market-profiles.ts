import { z } from "zod";

import {
  type IndustryIntegrationRecommendation,
  type IndustryProfileKey,
  type OnboardingOperationalAnswers,
  resolveIndustryProfileRecommendation,
} from "./industry-profiles";

export const marketKeySchema = z.enum(["uk", "pk"]);

export type MarketKey = z.infer<typeof marketKeySchema>;

export type MarketIntegrationRecommendation = IndustryIntegrationRecommendation;

export type MarketProfile = {
  key: MarketKey;
  name: string;
  status: "active" | "beta" | "planned";
  currency: "GBP" | "PKR";
  locale: string;
  defaultTimeZone: string;
  defaultCountryCode: string;
  supportedLanguages: string[];
  supportedVoiceLocales: string[];
  availableIndustryProfiles: IndustryProfileKey[];
  featuredIndustryProfiles: IndustryProfileKey[];
  recommendedIntegrations: MarketIntegrationRecommendation[];
  paymentProviders: string[];
  communicationProviders: string[];
  complianceProfile: string;
  pricingProfile: string;
  websiteProfile: string;
  onboardingProfile: string;
  defaultSalesContactMethod: string;
  defaultDemoMethod: string;
  featureFlags?: string[];
  website: {
    heroTitle: string;
    heroBody: string;
    primaryCta: string;
    secondaryCta: string;
    problemPoints: string[];
    solutionPoints: string[];
  };
};

function integrationsFor(
  entries: Array<[string, string, MarketIntegrationRecommendation["level"], string]>
): MarketIntegrationRecommendation[] {
  return entries.map(([key, label, level, reason]) => ({ key, label, level, reason }));
}

export const MARKET_PROFILES: Record<MarketKey, MarketProfile> = {
  uk: {
    key: "uk",
    name: "United Kingdom",
    status: "active",
    currency: "GBP",
    locale: "en-GB",
    defaultTimeZone: "Europe/London",
    defaultCountryCode: "+44",
    supportedLanguages: ["English"],
    supportedVoiceLocales: ["en-GB"],
    availableIndustryProfiles: [
      "service_basic",
      "restaurant_voice",
      "clinic_voice",
      "retail",
      "ecommerce",
      "wholesale",
      "distribution",
    ],
    featuredIndustryProfiles: ["service_basic", "restaurant_voice", "clinic_voice", "retail"],
    recommendedIntegrations: integrationsFor([
      ["google_calendar", "Google Calendar", "ESSENTIAL", "Booking-heavy UK teams often need shared calendar visibility."],
      ["outlook_calendar", "Outlook Calendar", "ESSENTIAL", "Common fit for Microsoft-based appointment workflows."],
      ["hubspot", "HubSpot", "RECOMMENDED", "Useful for lead handling and sales follow-up."],
      ["stripe", "Stripe", "RECOMMENDED", "Useful for deposits, invoices, and payment links."],
      ["twilio_sms", "Twilio SMS", "RECOMMENDED", "Useful for confirmations and reminders."],
    ]),
    paymentProviders: ["stripe"],
    communicationProviders: ["phone", "sms", "email", "whatsapp_business"],
    complianceProfile: "uk_standard_voice",
    pricingProfile: "voice_uk_gbp",
    websiteProfile: "voice_uk_funnel",
    onboardingProfile: "market_aware_uk",
    defaultSalesContactMethod: "email",
    defaultDemoMethod: "book_demo",
    featureFlags: [
      "market_profiles",
      "market_uk",
      "market_aware_onboarding",
      "website_uk_funnel",
      "voice_uk_localization",
    ],
    website: {
      heroTitle: "Never miss a booking, enquiry or customer call.",
      heroBody:
        "WhatsQuery Voice answers calls, captures leads, manages appointments and connects with the software your business already uses.",
      primaryCta: "Hear WhatsQuery in action",
      secondaryCta: "Book a demonstration",
      problemPoints: [
        "Missed calls turn into lost bookings and slow follow-up.",
        "Staff get interrupted by repetitive questions all day.",
        "Customer details stay scattered across inboxes and notes.",
      ],
      solutionPoints: [
        "24/7 call answering with professional call routing.",
        "Booking, appointment capture, summaries, and escalations.",
        "CRM, calendar, and follow-up workflows built for UK teams.",
      ],
    },
  },
  pk: {
    key: "pk",
    name: "Pakistan",
    status: "active",
    currency: "PKR",
    locale: "en-PK",
    defaultTimeZone: "Asia/Karachi",
    defaultCountryCode: "+92",
    supportedLanguages: ["English", "Urdu"],
    supportedVoiceLocales: ["en-PK", "ur-PK"],
    availableIndustryProfiles: [
      "restaurant_voice",
      "retail",
      "wholesale",
      "distribution",
      "manufacturing",
      "textile",
      "ecommerce",
      "service_basic",
    ],
    featuredIndustryProfiles: ["restaurant_voice", "retail", "wholesale", "textile"],
    recommendedIntegrations: integrationsFor([
      ["whatsapp_business", "WhatsApp Business", "ESSENTIAL", "Pakistan sales and support teams are commonly WhatsApp-first."],
      ["google_sheets", "Google Sheets", "ESSENTIAL", "Useful for imports, reporting, and quick deployment."],
      ["hubspot", "HubSpot", "RECOMMENDED", "Useful when structured lead follow-up is required."],
      ["outlook_email", "Outlook Email", "RECOMMENDED", "Useful for quotations and account communication."],
      ["universal_rest", "Universal REST API", "ADVANCED", "Useful for local systems and custom connectors."],
    ]),
    paymentProviders: ["manual_bank_transfer", "raast_ready"],
    communicationProviders: ["phone", "whatsapp", "sms", "email"],
    complianceProfile: "pk_standard_voice",
    pricingProfile: "voice_pk_pkr",
    websiteProfile: "voice_pk_funnel",
    onboardingProfile: "market_aware_pk",
    defaultSalesContactMethod: "whatsapp",
    defaultDemoMethod: "live_demo",
    featureFlags: [
      "market_profiles",
      "market_pk",
      "market_aware_onboarding",
      "website_pk_funnel",
      "voice_pk_localization",
    ],
    website: {
      heroTitle: "Calls, WhatsApp, orders and business operations - all in one system.",
      heroBody:
        "WhatsQuery helps Pakistani businesses manage customer calls, orders, inventory, follow-ups and daily operations from one platform.",
      primaryCta: "Live demo dekhein",
      secondaryCta: "WhatsApp par baat karein",
      problemPoints: [
        "Missed customer calls and untracked WhatsApp conversations.",
        "Manual registers, Excel files, and disconnected branch data.",
        "Slow order follow-up and inventory mistakes across teams.",
      ],
      solutionPoints: [
        "Urdu and English voice handling with WhatsApp-first follow-up.",
        "Order capture, customer ledgers, branch operations, and reporting.",
        "ERP, POS, inventory, and voice workflows in one operating layer.",
      ],
    },
  },
};

export type MarketSignalInput = {
  marketKey?: string | null;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  locale?: string | null;
  countryCode?: string | null;
  phone?: string | null;
};

export function getMarketProfile(marketKey: MarketKey) {
  return MARKET_PROFILES[marketKey];
}

export function resolveMarketKeyFromSignals(input: MarketSignalInput): MarketKey | null {
  if (input.marketKey && marketKeySchema.safeParse(input.marketKey).success) {
    return input.marketKey as MarketKey;
  }

  const signal = [
    input.country,
    input.currency,
    input.timezone,
    input.locale,
    input.countryCode,
    input.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    signal.includes("pakistan") ||
    signal.includes("pkr") ||
    signal.includes("karachi") ||
    signal.includes("en-pk") ||
    signal.includes("ur-pk") ||
    signal.includes("+92")
  ) {
    return "pk";
  }

  if (
    signal.includes("united kingdom") ||
    signal.includes("great britain") ||
    signal.includes("britain") ||
    signal.includes("gbp") ||
    signal.includes("london") ||
    signal.includes("en-gb") ||
    signal.includes("+44")
  ) {
    return "uk";
  }

  return null;
}

export function getMarketDefaults(marketKey: MarketKey) {
  const market = MARKET_PROFILES[marketKey];
  return {
    marketKey: market.key,
    currency: market.currency,
    locale: market.locale,
    timezone: market.defaultTimeZone,
    countryCode: market.defaultCountryCode,
    pricingProfile: market.pricingProfile,
    complianceProfile: market.complianceProfile,
    country: market.name,
  };
}

export function getAvailableIndustryProfilesForMarket(marketKey: MarketKey) {
  return MARKET_PROFILES[marketKey].availableIndustryProfiles;
}

function mergeRecommendations(
  marketRecommendations: MarketIntegrationRecommendation[],
  industryRecommendations: IndustryIntegrationRecommendation[]
) {
  const merged = new Map<string, MarketIntegrationRecommendation>();
  const priorityOrder = ["ESSENTIAL", "RECOMMENDED", "OPTIONAL", "ADVANCED", "COMING_SOON", "NOT_APPLICABLE"];

  for (const recommendation of [...marketRecommendations, ...industryRecommendations]) {
    const existing = merged.get(recommendation.key);
    if (!existing) {
      merged.set(recommendation.key, recommendation);
      continue;
    }

    const currentPriority = priorityOrder.indexOf(existing.level);
    const nextPriority = priorityOrder.indexOf(recommendation.level);
    if (nextPriority !== -1 && (currentPriority === -1 || nextPriority < currentPriority)) {
      merged.set(recommendation.key, recommendation as MarketIntegrationRecommendation);
    }
  }

  return [...merged.values()];
}

export function resolveMarketAwareRecommendation(
  marketKey: MarketKey,
  selectedIndustry: IndustryProfileKey,
  answers: OnboardingOperationalAnswers
) {
  const market = MARKET_PROFILES[marketKey];
  const industry = resolveIndustryProfileRecommendation(selectedIndustry, answers);

  return {
    market,
    industry,
    integrations: mergeRecommendations(market.recommendedIntegrations, industry.summary.recommendedIntegrations),
    voiceLocales: market.supportedVoiceLocales,
  };
}
