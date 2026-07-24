export function maskPhoneNumber(value?: string | null) {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  const prefix = normalized.startsWith("+") ? normalized.slice(0, Math.min(3, normalized.length - 4)) : "";
  return `${prefix}${"•".repeat(Math.min(6, Math.max(3, digits.length - 4)))}${digits.slice(-4)}`;
}

export function maskSecret(value?: string | null) {
  if (!value) return null;
  if (value.length <= 6) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}
