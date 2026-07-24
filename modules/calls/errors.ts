export type TelecomErrorCode =
  | "INVALID_PHONE_NUMBER"
  | "AMBIGUOUS_PHONE_NUMBER"
  | "AMBIGUOUS_WEBHOOK_MAPPING"
  | "UNSUPPORTED_COUNTRY"
  | "DESTINATION_BLOCKED"
  | "CALLING_DISABLED"
  | "ACTIVATION_DENIED"
  | "SIMULATION_ONLY"
  | "EMERGENCY_STOP_ACTIVE"
  | "TENANT_NOT_PILOT_ENABLED"
  | "DESTINATION_NOT_ALLOWLISTED"
  | "CALLER_ID_NOT_PILOT_APPROVED"
  | "COUNTRY_NOT_ALLOWED"
  | "OUTSIDE_CALLING_HOURS"
  | "ACTIVATION_NOT_STARTED"
  | "ACTIVATION_EXPIRED"
  | "CALL_RATE_LIMITED"
  | "CALL_CONCURRENCY_LIMIT_REACHED"
  | "CALL_SPENDING_LIMIT_REACHED"
  | "INVALID_ACTIVATION_CONFIGURATION"
  | "TENANT_SUSPENDED"
  | "CALLER_ID_REQUIRED"
  | "CALLER_ID_UNAUTHORIZED"
  | "CALLER_ID_UNVERIFIED"
  | "NO_ROUTE_AVAILABLE"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "DUPLICATE_REQUEST"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_WEBHOOK_SIGNATURE"
  | "WEBHOOK_REPLAY_DETECTED"
  | "UNKNOWN_PROVIDER_CALL"
  | "UNKNOWN_TENANT_MAPPING"
  | "INVALID_STATE_TRANSITION"
  | "TEMPORARY_PROVIDER_FAILURE"
  | "PERMANENT_DESTINATION_FAILURE";

export class TelecomError extends Error {
  constructor(
    readonly code: TelecomErrorCode,
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "TelecomError";
  }
}

export function telecomErrorResponse(error: unknown, fallbackMessage = "Telecom request failed.") {
  if (error instanceof TelecomError) {
    return {
      status: error.status,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 400,
    body: {
      success: false,
      error: {
        code: "TELECOM_ERROR",
        message: error instanceof Error ? error.message : fallbackMessage,
      },
    },
  };
}
