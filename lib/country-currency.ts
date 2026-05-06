const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  pakistan: "PKR",
  pk: "PKR",
  "united kingdom": "GBP",
  uk: "GBP",
  gb: "GBP",
  uae: "AED",
  "united arab emirates": "AED",
  usa: "USD",
  us: "USD",
  "united states": "USD",
  saudi: "SAR",
  "saudi arabia": "SAR",
};

export function getCurrencyForCountry(country?: string | null) {
  const normalized = country?.trim().toLowerCase();
  if (!normalized) {
    return "USD";
  }

  return COUNTRY_CURRENCY_MAP[normalized] ?? "USD";
}
