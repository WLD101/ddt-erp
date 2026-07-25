import { prisma } from "@/lib/prisma";
import {
  getMarketDefaults,
  getMarketProfile,
  marketKeySchema,
  type MarketKey,
} from "@/modules/onboarding/market-profiles";

const MARKET_PHONE_COUNTRY: Record<MarketKey, "GB" | "PK"> = {
  uk: "GB",
  pk: "PK",
};

const MARKET_PAYMENT_METHODS = {
  uk: ["cash", "debit_card", "credit_card", "bank_transfer", "stripe", "payment_link"],
  pk: ["cash", "bank_transfer", "card", "jazzcash", "easypaisa", "raast"],
} as const;

const MARKET_ADDRESS_FIELDS = {
  uk: ["address_line_1", "address_line_2", "town_or_city", "county", "postcode", "country"],
  pk: ["address", "area", "city", "district", "province", "postal_code", "country"],
} as const;

const MARKET_BUSINESS_FIELDS = {
  uk: ["company_name", "trading_name", "company_number", "vat_registration_number", "registered_office"],
  pk: ["business_name", "branch_name", "ntn", "strn", "fbr_registration_details"],
} as const;

const MARKET_LOCALES: Record<MarketKey, string[]> = {
  uk: ["en-GB"],
  pk: ["en-PK", "ur-PK"],
};

const MARKET_DOCUMENT_LABELS = {
  uk: {
    invoice: "VAT invoice",
    receipt: "Receipt",
    amountPaid: "Amount paid",
    balanceDue: "Balance due",
    taxBreakdown: "VAT breakdown",
  },
  pk: {
    invoice: "Sales invoice",
    receipt: "Receipt",
    amountPaid: "Amount paid",
    balanceDue: "Balance due",
    taxBreakdown: "Sales-tax breakdown",
  },
} as const;

const MARKET_REPORT_LABELS = {
  uk: {
    revenue: "Revenue",
    taxSummary: "VAT summary",
    paymentGroups: ["card", "bank", "cash"],
  },
  pk: {
    revenue: "Revenue",
    taxSummary: "Sales-tax summary",
    paymentGroups: ["cash", "jazzcash", "easypaisa", "bank"],
  },
} as const;

type MarketDocumentLabels = {
  invoice: string;
  receipt: string;
  amountPaid: string;
  balanceDue: string;
  taxBreakdown: string;
};

type MarketReportLabels = {
  revenue: string;
  taxSummary: string;
  paymentGroups: readonly string[];
};

export type SupportedMarketPaymentMethod =
  | "cash"
  | "debit_card"
  | "credit_card"
  | "bank_transfer"
  | "stripe"
  | "payment_link"
  | "card"
  | "jazzcash"
  | "easypaisa"
  | "raast";

export type TenantMarketOrganizationSnapshot = {
  id?: string | null;
  marketKey?: string | null;
  marketRequiresReview?: boolean | null;
  country?: string | null;
  currency?: string | null;
  locale?: string | null;
  timezone?: string | null;
  countryCode?: string | null;
  taxLabel?: string | null;
  pricingProfile?: string | null;
  complianceProfile?: string | null;
};

export type ResolvedTenantMarketContext = {
  status: "resolved";
  organizationId: string | null;
  marketKey: MarketKey;
  marketName: string;
  currency: "GBP" | "PKR";
  locale: string;
  timezone: string;
  country: string;
  phoneCountry: "GB" | "PK";
  phoneDialCode: "+44" | "+92";
  taxLabel: string;
  pricingProfile: string;
  complianceProfile: string;
  paymentMethods: SupportedMarketPaymentMethod[];
  addressFields: string[];
  businessFields: string[];
  supportedVoiceLocales: string[];
  documentLabels: MarketDocumentLabels;
  reportLabels: MarketReportLabels;
};

export type ReviewRequiredTenantMarketContext = {
  status: "review_required";
  organizationId: string | null;
  marketKey: null;
  reason: string;
};

export type TenantMarketContext =
  | ResolvedTenantMarketContext
  | ReviewRequiredTenantMarketContext;

function getMarketTaxLabel(marketKey: MarketKey, configuredTaxLabel?: string | null) {
  const normalized = configuredTaxLabel?.trim();
  if (normalized) return normalized;
  return marketKey === "uk" ? "VAT" : "Sales Tax";
}

function isCurrencyCompatibleWithMarket(currency: string | null | undefined, marketKey: MarketKey) {
  if (!currency) return true;
  return currency.trim().toUpperCase() === getMarketProfile(marketKey).currency;
}

function isLocaleCompatibleWithMarket(locale: string | null | undefined, marketKey: MarketKey) {
  if (!locale) return true;
  return MARKET_LOCALES[marketKey].includes(locale.trim());
}

function isCountryCodeCompatibleWithMarket(countryCode: string | null | undefined, marketKey: MarketKey) {
  if (!countryCode) return true;
  const normalized = countryCode.trim().toUpperCase();
  return normalized === MARKET_PHONE_COUNTRY[marketKey] || normalized === getMarketDefaults(marketKey).countryCode;
}

export function resolveTenantMarketContextFromOrganization(
  organization: TenantMarketOrganizationSnapshot,
): TenantMarketContext {
  const parsedMarketKey = marketKeySchema.safeParse(organization.marketKey);
  if (!parsedMarketKey.success) {
    return {
      status: "review_required",
      organizationId: organization.id ?? null,
      marketKey: null,
      reason: "Tenant market is missing or invalid. Market-specific automation must stay in review mode.",
    };
  }

  const marketKey = parsedMarketKey.data;
  if (organization.marketRequiresReview !== false) {
    return {
      status: "review_required",
      organizationId: organization.id ?? null,
      marketKey: null,
      reason: "Tenant market requires review before UK or Pakistan behavior can be activated.",
    };
  }

  if (!isCurrencyCompatibleWithMarket(organization.currency, marketKey)) {
    return {
      status: "review_required",
      organizationId: organization.id ?? null,
      marketKey: null,
      reason: "Tenant currency does not match the configured market.",
    };
  }

  if (!isLocaleCompatibleWithMarket(organization.locale, marketKey)) {
    return {
      status: "review_required",
      organizationId: organization.id ?? null,
      marketKey: null,
      reason: "Tenant locale does not match the configured market.",
    };
  }

  if (!isCountryCodeCompatibleWithMarket(organization.countryCode, marketKey)) {
    return {
      status: "review_required",
      organizationId: organization.id ?? null,
      marketKey: null,
      reason: "Tenant phone country configuration does not match the configured market.",
    };
  }

  const market = getMarketProfile(marketKey);
  const defaults = getMarketDefaults(marketKey);

  return {
    status: "resolved",
    organizationId: organization.id ?? null,
    marketKey,
    marketName: market.name,
    currency: market.currency,
    locale: organization.locale?.trim() || defaults.locale,
    timezone: organization.timezone?.trim() || defaults.timezone,
    country: organization.country?.trim() || defaults.country,
    phoneCountry: MARKET_PHONE_COUNTRY[marketKey],
    phoneDialCode: defaults.countryCode as "+44" | "+92",
    taxLabel: getMarketTaxLabel(marketKey, organization.taxLabel),
    pricingProfile: organization.pricingProfile?.trim() || defaults.pricingProfile,
    complianceProfile: organization.complianceProfile?.trim() || defaults.complianceProfile,
    paymentMethods: [...MARKET_PAYMENT_METHODS[marketKey]],
    addressFields: [...MARKET_ADDRESS_FIELDS[marketKey]],
    businessFields: [...MARKET_BUSINESS_FIELDS[marketKey]],
    supportedVoiceLocales: [...MARKET_LOCALES[marketKey]],
    documentLabels: MARKET_DOCUMENT_LABELS[marketKey],
    reportLabels: MARKET_REPORT_LABELS[marketKey],
  };
}

export async function getTenantMarketContext(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      marketKey: true,
      marketRequiresReview: true,
      country: true,
      currency: true,
      locale: true,
      timezone: true,
      countryCode: true,
      taxLabel: true,
      pricingProfile: true,
      complianceProfile: true,
    },
  });

  return resolveTenantMarketContextFromOrganization({
    id: organization?.id ?? organizationId,
    marketKey: organization?.marketKey,
    marketRequiresReview: organization?.marketRequiresReview,
    country: organization?.country,
    currency: organization?.currency,
    locale: organization?.locale,
    timezone: organization?.timezone,
    countryCode: organization?.countryCode,
    taxLabel: organization?.taxLabel,
    pricingProfile: organization?.pricingProfile,
    complianceProfile: organization?.complianceProfile,
  });
}

export function assertResolvedTenantMarketContext(
  context: TenantMarketContext,
): asserts context is ResolvedTenantMarketContext {
  if (context.status !== "resolved") {
    throw new Error(context.reason);
  }
}

export function assertRequestedMarketMatchesTenant(
  context: ResolvedTenantMarketContext,
  requestedMarketKey?: string | null,
) {
  if (!requestedMarketKey) return;
  if (requestedMarketKey !== context.marketKey) {
    throw new Error(`Tenant market ${context.marketKey} cannot be overridden by requested market ${requestedMarketKey}.`);
  }
}

export function normalizePaymentMethodForMarket(
  value: string | null | undefined,
  marketKey: MarketKey,
): SupportedMarketPaymentMethod | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  if (marketKey === "uk") {
    if (normalized === "cash") return "cash";
    if (normalized === "debit card" || normalized === "debit_card") return "debit_card";
    if (normalized === "credit card" || normalized === "credit_card") return "credit_card";
    if (normalized === "bank transfer" || normalized === "bank_transfer") return "bank_transfer";
    if (normalized === "stripe") return "stripe";
    if (normalized === "payment link" || normalized === "payment_link") return "payment_link";
    return null;
  }

  if (normalized === "cash") return "cash";
  if (normalized === "bank transfer" || normalized === "bank_transfer") return "bank_transfer";
  if (normalized === "card") return "card";
  if (normalized === "jazzcash") return "jazzcash";
  if (normalized === "easypaisa") return "easypaisa";
  if (normalized === "raast") return "raast";
  return null;
}

export function isPaymentMethodAllowedForMarket(
  paymentMethod: string | null | undefined,
  marketKey: MarketKey,
) {
  return normalizePaymentMethodForMarket(paymentMethod, marketKey) !== null;
}

export function assertJournalCurrencyMatchesMarket(input: {
  marketKey: MarketKey;
  currency: string;
  entryCurrencies: string[];
}) {
  const marketCurrency = getMarketProfile(input.marketKey).currency;
  const candidateCurrencies = [input.currency, ...input.entryCurrencies].map((value) => value.trim().toUpperCase());

  if (candidateCurrencies.some((currency) => currency !== marketCurrency)) {
    throw new Error(`Mixed-market currency is not allowed for ${input.marketKey.toUpperCase()} journals.`);
  }
}
