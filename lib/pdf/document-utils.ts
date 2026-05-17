export function sanitizeFilenamePart(value: string | null | undefined, fallback = "Document") {
  return (value || fallback)
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || fallback;
}

export function formatMoney(amount: number, currency = "PKR") {
  const safeCurrency = currency?.trim() || "PKR";
  const symbol = safeCurrency.toUpperCase() === "PKR" ? "Rs." : safeCurrency.toUpperCase();
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
