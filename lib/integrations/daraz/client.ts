import "server-only";

import { decryptIntegrationCredentials } from "../shared/encryption";
import { isDemoModeEnabled } from "@/lib/demo-mode";

import { DEFAULT_DARAZ_API_BASE_URL } from "./constants";
import { signDarazRequest } from "./signature";
import { DarazConfig, DarazCredentials, DarazCreateProductResponse, DarazRequestParams } from "./types";

type DarazChannelRecord = {
  configuration: string | null;
  credentialsEncrypted: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => typeof entry === "string")
  ) as Record<string, string>;
}

function parseConfiguration(configuration: string | null | undefined): DarazConfig {
  if (!configuration) {
    return {};
  }

  try {
    const parsed = JSON.parse(configuration) as Record<string, unknown>;
    return {
      apiBaseUrl: asString(parsed.apiBaseUrl) || undefined,
      shopId: asString(parsed.shopId) || undefined,
      useMock: asBoolean(parsed.useMock),
      defaultCategoryExternalId: asString(parsed.defaultCategoryExternalId) || undefined,
      defaultProductDescription: asString(parsed.defaultProductDescription) || undefined,
      defaultImageUrl: asString(parsed.defaultImageUrl) || undefined,
      defaultAttributes: asStringRecord(parsed.defaultAttributes),
      categoryMappings:
        parsed.categoryMappings && typeof parsed.categoryMappings === "object" && !Array.isArray(parsed.categoryMappings)
          ? Object.fromEntries(
              Object.entries(parsed.categoryMappings).map(([key, value]) => {
                const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
                return [
                  key,
                  {
                    primaryCategory: asString((record as Record<string, unknown>).primaryCategory),
                    attributes: asStringRecord((record as Record<string, unknown>).attributes),
                    imageUrl: asString((record as Record<string, unknown>).imageUrl) || undefined,
                    description: asString((record as Record<string, unknown>).description) || undefined,
                  },
                ];
              })
            )
          : undefined,
    };
  } catch {
    return {};
  }
}

function resolveCredentials(encryptedPayload: string | null | undefined): DarazCredentials {
  const decrypted = decryptIntegrationCredentials(encryptedPayload);

  return {
    appKey: asString(decrypted.appKey) || process.env.DARAZ_APP_KEY || "",
    appSecret: asString(decrypted.appSecret) || process.env.DARAZ_APP_SECRET || "",
    accessToken: asString(decrypted.accessToken) || process.env.DARAZ_ACCESS_TOKEN || "",
    refreshToken: asString(decrypted.refreshToken) || process.env.DARAZ_REFRESH_TOKEN || undefined,
    sellerId: asString(decrypted.sellerId) || process.env.DARAZ_SELLER_ID || "",
  };
}

export function resolveDarazChannelContext(channel: DarazChannelRecord) {
  const config = parseConfiguration(channel.configuration);
  const credentials = resolveCredentials(channel.credentialsEncrypted);

  return {
    config,
    credentials,
    baseUrl: config.apiBaseUrl || DEFAULT_DARAZ_API_BASE_URL,
  };
}

export function isDarazDemoMode(config: DarazConfig, credentials?: Partial<DarazCredentials>) {
  if (isDemoModeEnabled()) {
    return true;
  }

  if (typeof config.useMock === "boolean") {
    return config.useMock;
  }

  if (process.env.DARAZ_DEMO_MODE === "true") {
    return true;
  }

  if (process.env.DARAZ_MOCK_MODE === "true") {
    return true;
  }

  return !credentials?.appKey || !credentials?.appSecret || !credentials?.accessToken;
}

type DarazRequestOptions = {
  path: string;
  credentials: DarazCredentials;
  baseUrl?: string;
  params?: DarazRequestParams;
  body?: unknown;
  method?: "GET" | "POST";
};

export async function requestDaraz<T = DarazCreateProductResponse>({
  path,
  credentials,
  baseUrl = DEFAULT_DARAZ_API_BASE_URL,
  params = {},
  body,
  method = "POST",
}: DarazRequestOptions): Promise<T> {
  const timestamp = Date.now().toString();
  const signed = signDarazRequest(
    path,
    {
      ...params,
      app_key: credentials.appKey,
      access_token: credentials.accessToken,
      timestamp,
    },
    credentials.appSecret
  );

  const query = new URLSearchParams({
    ...signed.params,
    sign: signed.sign,
  });

  const response = await fetch(`${baseUrl}${path}?${query.toString()}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as DarazCreateProductResponse | null;

  if (!response.ok) {
    const message =
      payload?.message ||
      `Daraz API request failed: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (
    payload &&
    ((payload.code !== undefined && String(payload.code) !== "0") ||
      payload.success === false)
  ) {
    throw new Error(payload.message || "Daraz rejected the request.");
  }

  return payload as T;
}
