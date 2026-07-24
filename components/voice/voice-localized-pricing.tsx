"use client";

import { useEffect, useMemo, useState } from "react";

type SupportedCurrency = "PKR" | "USD" | "GBP" | "EUR" | "AED";

type PriceMap = Record<SupportedCurrency, number>;

type CurrencyMeta = {
  code: SupportedCurrency;
  locale: string;
  label: string;
};

const DEFAULT_CURRENCY: CurrencyMeta = {
  code: "USD",
  locale: "en-US",
  label: "United States",
};

const CURRENCY_BY_CODE: Record<SupportedCurrency, CurrencyMeta> = {
  PKR: { code: "PKR", locale: "en-PK", label: "Pakistan" },
  USD: { code: "USD", locale: "en-US", label: "United States" },
  GBP: { code: "GBP", locale: "en-GB", label: "United Kingdom" },
  EUR: { code: "EUR", locale: "de-DE", label: "Europe" },
  AED: { code: "AED", locale: "en-AE", label: "United Arab Emirates" },
};

function detectCurrencyMeta(): CurrencyMeta {
  if (typeof window === "undefined") {
    return DEFAULT_CURRENCY;
  }

  const language = (navigator.language || "").toLowerCase();
  const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
  const signal = `${language} ${timeZone}`;

  if (signal.includes("-pk") || signal.startsWith("ur") || timeZone.includes("karachi")) {
    return CURRENCY_BY_CODE.PKR;
  }

  if (signal.includes("-gb") || timeZone.includes("london")) {
    return CURRENCY_BY_CODE.GBP;
  }

  if (signal.includes("-ae") || timeZone.includes("dubai")) {
    return CURRENCY_BY_CODE.AED;
  }

  if (
    signal.includes("-de") ||
    signal.includes("-fr") ||
    signal.includes("-es") ||
    signal.includes("-it") ||
    signal.includes("-nl") ||
    timeZone.includes("berlin") ||
    timeZone.includes("paris") ||
    timeZone.includes("madrid") ||
    timeZone.includes("rome") ||
    timeZone.includes("amsterdam")
  ) {
    return CURRENCY_BY_CODE.EUR;
  }

  return DEFAULT_CURRENCY;
}

function formatAmount(value: number, currency: CurrencyMeta) {
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LocalizedVoicePrice({
  prices,
  amountClassName,
  periodClassName,
  period = "/month",
}: {
  prices: PriceMap;
  amountClassName?: string;
  periodClassName?: string;
  period?: string;
}) {
  const [currency, setCurrency] = useState<CurrencyMeta>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(detectCurrencyMeta());
  }, []);

  const amount = useMemo(() => prices[currency.code] ?? prices.USD, [currency.code, prices]);

  return (
    <>
      <div className={amountClassName}>{formatAmount(amount, currency)}</div>
      <div className={periodClassName}>{period}</div>
    </>
  );
}

export function VoiceLocalizedPricingNote({
  className,
}: {
  className?: string;
}) {
  const [currency, setCurrency] = useState<CurrencyMeta>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(detectCurrencyMeta());
  }, []);

  return (
    <p className={className}>
      Pricing is shown in {currency.code} based on your browser locale and timezone. Final billing is confirmed during setup.
    </p>
  );
}
