import { type MarketKey } from "@/modules/onboarding/market-profiles";

export type SupportedPricingCurrency = "GBP" | "PKR" | "USD" | "EUR" | "AED";

export type PricingPlan = {
  name: string;
  description: string;
  prices: Record<SupportedPricingCurrency, number>;
};

export type PricingProfile = {
  key: string;
  marketKey: MarketKey;
  currency: "GBP" | "PKR";
  billingPeriods: string[];
  plans: PricingPlan[];
  taxes?: { label: string; included: boolean };
  contactSalesRules?: { mode: "contact_sales" | "self_serve" };
};

export const PRICING_PROFILES: Record<MarketKey, PricingProfile> = {
  uk: {
    key: "voice_uk_gbp",
    marketKey: "uk",
    currency: "GBP",
    billingPeriods: ["monthly"],
    taxes: { label: "VAT", included: false },
    contactSalesRules: { mode: "contact_sales" },
    plans: [
      {
        name: "Starter",
        description: "For smaller teams that need reliable call answering and lead capture.",
        prices: { GBP: 43, PKR: 15000, USD: 54, EUR: 49, AED: 199 },
      },
      {
        name: "Growth",
        description: "For businesses that need higher call volume, appointments, and integrations.",
        prices: { GBP: 99, PKR: 35000, USD: 125, EUR: 114, AED: 469 },
      },
      {
        name: "Pro",
        description: "For advanced teams with heavier automation, analytics, and support requirements.",
        prices: { GBP: 157, PKR: 55000, USD: 197, EUR: 179, AED: 729 },
      },
    ],
  },
  pk: {
    key: "voice_pk_pkr",
    marketKey: "pk",
    currency: "PKR",
    billingPeriods: ["monthly"],
    taxes: { label: "Sales Tax", included: false },
    contactSalesRules: { mode: "contact_sales" },
    plans: [
      {
        name: "Starter",
        description: "For businesses starting with voice, WhatsApp follow-up, and basic operational capture.",
        prices: { GBP: 43, PKR: 15000, USD: 54, EUR: 49, AED: 199 },
      },
      {
        name: "Growth",
        description: "For growing teams managing more branches, orders, and customer conversations.",
        prices: { GBP: 99, PKR: 35000, USD: 125, EUR: 114, AED: 469 },
      },
      {
        name: "Pro",
        description: "For high-volume teams that need deeper automation, dashboards, and support coverage.",
        prices: { GBP: 157, PKR: 55000, USD: 197, EUR: 179, AED: 729 },
      },
    ],
  },
};

export function getPricingProfile(marketKey: MarketKey) {
  return PRICING_PROFILES[marketKey];
}
