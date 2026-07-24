export const INTEGRATION_ERROR_CODES = [
  "INTEGRATION_NOT_FOUND",
  "PROVIDER_DISABLED",
  "CONNECTION_NOT_READY",
  "CREDENTIALS_EXPIRED",
  "RECONNECT_REQUIRED",
  "MISSING_SCOPE",
  "ACTION_NOT_SUPPORTED",
  "ACTION_NOT_ALLOWED",
  "APPROVAL_REQUIRED",
  "APPROVAL_EXPIRED",
  "RESOURCE_NOT_FOUND",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "INVALID_CONFIGURATION",
  "VALIDATION_FAILED",
  "DUPLICATE_EVENT",
  "SYNC_CONFLICT",
  "WEBHOOK_VERIFICATION_FAILED",
  "TIMEOUT",
] as const;

export type IntegrationErrorCode = (typeof INTEGRATION_ERROR_CODES)[number];

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly statusCode: number;
  readonly safeDetails?: Record<string, unknown>;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    options?: { statusCode?: number; safeDetails?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
    this.statusCode = options?.statusCode ?? 400;
    this.safeDetails = options?.safeDetails;
  }
}

export function toSafeIntegrationError(error: unknown) {
  if (error instanceof IntegrationError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.safeDetails,
    };
  }

  return {
    code: "PROVIDER_UNAVAILABLE" as const,
    message: "The integration could not complete this request right now.",
    statusCode: 500,
  };
}
