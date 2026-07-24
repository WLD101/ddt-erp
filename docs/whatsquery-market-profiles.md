# WhatsQuery Market Profiles

## Scope

This document defines the first shared market-profile layer for WhatsQuery Voice and the wider platform. As of Wednesday, July 22, 2026, the active supported markets are:

- `uk`
- `pk`

The market profile is separate from the industry profile.

```text
Tenant
-> Market profile
-> Industry profile
-> Operational model
-> Capabilities
-> Integrations
-> Voice locale and pricing
```

## Source of truth

Primary registry:

- `modules/onboarding/market-profiles.ts`

Pricing source of truth:

- `modules/voice/pricing-profiles.ts`

## Current fields

Each market profile now carries:

- base currency
- locale
- default time zone
- default country code
- supported languages
- supported voice locales
- available and featured industry profiles
- recommended integrations
- payment and communication priorities
- pricing and compliance profile keys
- website funnel copy scaffolding

## Current supported markets

### United Kingdom

- Currency: `GBP`
- Locale: `en-GB`
- Time zone: `Europe/London`
- Country code: `+44`
- Positioning: AI receptionist, bookings, lead capture, customer-service automation

### Pakistan

- Currency: `PKR`
- Locale: `en-PK`
- Time zone: `Asia/Karachi`
- Country code: `+92`
- Positioning: voice receptionist, WhatsApp-first follow-up, orders, ERP and branch operations

## Tenant storage

The schema now includes these tenant-facing fields on `Organization`:

- `marketKey`
- `locale`
- `countryCode`
- `pricingProfile`
- `complianceProfile`
- `marketRequiresReview`

The onboarding state also stores:

- `selectedMarketKey`

## Current limitation

The market-profile foundation is implemented in code and migration scaffolding has been added, but the live database apply step remains blocked by the unresolved direct Supabase migration connection issue documented separately in:

- `docs/whatsquery-database-migration-resolution.md`
