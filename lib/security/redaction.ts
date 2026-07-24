const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|api.?key|credential|codeverifier|private.?key|raw.?body|transcript)/i;

export function redactSensitiveText(value: string, maxLength = 1_000) {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(
      /\b(password|secret|token|api[_-]?key|authorization)\s*[:=]\s*["']?[^"',\s}]+/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /\b(postgres(?:ql)?|redis):\/\/([^:/\s]+):([^@\s]+)@/gi,
      "$1://[REDACTED]:[REDACTED]@",
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
      "[REDACTED_JWT]",
    )
    .slice(0, maxLength);
}

export function redactForLogging(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return value === null || value === undefined ? value : "[REDACTED]";
  }
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactForLogging(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactForLogging(childValue, childKey),
      ]),
    );
  }
  return value;
}

