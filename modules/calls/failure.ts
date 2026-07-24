export type CallFailureClass =
  | "TEMPORARY_PROVIDER_FAILURE"
  | "PERMANENT_DESTINATION_FAILURE"
  | "POLICY_REJECTION"
  | "AUTHENTICATION_FAILURE"
  | "RATE_LIMIT"
  | "INSUFFICIENT_FUNDS"
  | "CALLER_ID_REJECTION"
  | "UNKNOWN";

export function classifyProviderFailure(error: unknown): CallFailureClass {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();

  if (message.includes("rate limit")) return "RATE_LIMIT";
  if (message.includes("auth") || message.includes("signature") || message.includes("credential")) return "AUTHENTICATION_FAILURE";
  if (message.includes("blocked") || message.includes("policy") || message.includes("not permitted")) return "POLICY_REJECTION";
  if (message.includes("caller id")) return "CALLER_ID_REJECTION";
  if (message.includes("invalid") || message.includes("not valid") || message.includes("unsupported")) return "PERMANENT_DESTINATION_FAILURE";
  if (message.includes("timeout") || message.includes("unavailable") || message.includes("temporar") || message.includes("failed with 5")) {
    return "TEMPORARY_PROVIDER_FAILURE";
  }

  return "UNKNOWN";
}

export function isFallbackEligible(failureClass: CallFailureClass) {
  return failureClass === "TEMPORARY_PROVIDER_FAILURE" || failureClass === "UNKNOWN";
}

export function isUncertainProviderInvocationError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return message.includes("timeout") || message.includes("timed out") || message.includes("connection reset") || message.includes("econnreset");
}
