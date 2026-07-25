import type { MetadataJson } from "libphonenumber-js/core";
import type { ScopedPrisma } from "@/lib/db/client";
import type { MarketKey } from "@/modules/onboarding/market-profiles";
import { createCustomer, updateCustomer } from "@/modules/customers/service";

const phoneCore = eval("require")("libphonenumber-js/core") as typeof import("libphonenumber-js/core");
const metadataModule = eval("require")("libphonenumber-js/metadata.max.json") as
  | MetadataJson
  | { default: MetadataJson };
const phoneMetadata = ("default" in metadataModule ? metadataModule.default : metadataModule) as MetadataJson;

export type VoiceCustomerIdentity = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  callerProvidedName?: string | null;
  callerProvidedPhone?: string | null;
  callerProvidedEmail?: string | null;
  customerConfirmed?: boolean;
};

export type CustomerResolutionResult =
  | {
      status: "existing_customer";
      customerId: string;
      matchedBy: "phone" | "email" | "phone_and_email";
      normalizedPhone: string | null;
      normalizedEmail: string | null;
    }
  | {
      status: "created_customer";
      customerId: string;
      normalizedPhone: string | null;
      normalizedEmail: string | null;
    }
  | {
      status: "needs_information";
      reason: string;
      normalizedPhone: string | null;
      normalizedEmail: string | null;
    }
  | {
      status: "conflict";
      reason: string;
      normalizedPhone: string | null;
      normalizedEmail: string | null;
    };

export function normalizeVoicePhone(value: string | null | undefined, marketKey?: MarketKey | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/[\s()-]+/g, "");
  const defaultCountry = marketKey === "uk" ? "GB" : marketKey === "pk" ? "PK" : null;

  const direct = phoneCore.parsePhoneNumberFromString(compact, phoneMetadata);
  if (direct?.isValid()) return direct.number;

  if (defaultCountry) {
    const marketSpecific = phoneCore.parsePhoneNumberFromString(compact, { defaultCountry }, phoneMetadata);
    if (marketSpecific?.isValid()) return marketSpecific.number;
  }

  const pk = phoneCore.parsePhoneNumberFromString(compact, { defaultCountry: "PK" }, phoneMetadata);
  if (pk?.isValid()) return pk.number;

  const gb = phoneCore.parsePhoneNumberFromString(compact, { defaultCountry: "GB" }, phoneMetadata);
  if (gb?.isValid()) return gb.number;

  const withPrefix = compact.replace(/^00/, "+");
  const prefixed = phoneCore.parsePhoneNumberFromString(withPrefix, phoneMetadata);
  if (prefixed?.isValid()) return prefixed.number;

  if (/^\+\d{8,15}$/.test(withPrefix)) {
    return withPrefix;
  }

  return null;
}

export function normalizeVoiceEmail(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function resolveMatchedBy(hasPhone: boolean, hasEmail: boolean) {
  if (hasPhone && hasEmail) return "phone_and_email" as const;
  if (hasPhone) return "phone" as const;
  return "email" as const;
}

export async function resolveVoiceCustomer(
  db: ScopedPrisma,
  identity: VoiceCustomerIdentity,
  options?: { marketKey?: MarketKey | null },
) : Promise<CustomerResolutionResult> {
  const normalizedPhone = normalizeVoicePhone(identity.phone ?? identity.callerProvidedPhone, options?.marketKey);
  const normalizedEmail = normalizeVoiceEmail(identity.email ?? identity.callerProvidedEmail);
  const normalizedName = identity.name?.trim() || identity.callerProvidedName?.trim() || null;
  const confirmed = identity.customerConfirmed === true;

  if (!normalizedPhone && !normalizedEmail) {
    return {
      status: "needs_information",
      reason: "A confirmed phone number or email address is required before customer resolution.",
      normalizedPhone,
      normalizedEmail,
    };
  }

  const [phoneMatches, emailMatches] = await Promise.all([
    normalizedPhone
      ? db.customer.findMany({
          where: { phone: normalizedPhone },
          select: { id: true, name: true, email: true, phone: true, address: true },
          take: 5,
        })
      : Promise.resolve([]),
    normalizedEmail
      ? db.customer.findMany({
          where: { email: normalizedEmail },
          select: { id: true, name: true, email: true, phone: true, address: true },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const phoneCustomer = phoneMatches[0] ?? null;
  const emailCustomer = emailMatches[0] ?? null;

  if (phoneCustomer && emailCustomer && phoneCustomer.id !== emailCustomer.id) {
    return {
      status: "conflict",
      reason: "The provided phone number and email resolve to different tenant customers.",
      normalizedPhone,
      normalizedEmail,
    };
  }

  const existing = phoneCustomer ?? emailCustomer;
  if (existing) {
    if (confirmed && normalizedName && existing.name !== normalizedName) {
      await updateCustomer(db, existing.id, {
        name: normalizedName,
        email: normalizedEmail ?? existing.email ?? "",
        phone: normalizedPhone ?? existing.phone ?? "",
        address: identity.address ?? existing.address ?? "",
        status: "ACTIVE",
      });
    }

    return {
      status: "existing_customer",
      customerId: existing.id,
      matchedBy: resolveMatchedBy(Boolean(phoneCustomer), Boolean(emailCustomer)),
      normalizedPhone,
      normalizedEmail,
    };
  }

  if (!confirmed || !normalizedName) {
    return {
      status: "needs_information",
      reason: "A confirmed customer name is required before creating a new tenant customer.",
      normalizedPhone,
      normalizedEmail,
    };
  }

  const customer = await createCustomer(db, {
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    address: identity.address ?? null,
    status: "ACTIVE",
  });

  return {
    status: "created_customer",
    customerId: customer.id,
    normalizedPhone,
    normalizedEmail,
  };
}
