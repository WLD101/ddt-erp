# WhatsQuery Integration Foundation Audit

Date: July 22, 2026

## Migration precheck

- Existing migration inspected: `prisma/migrations/202607220001_industry_profile_onboarding/migration.sql`
- Schema match: yes
- `npx prisma migrate dev --name integration_foundation_precheck`: failed against the current Supabase-backed development database with a Prisma schema-engine error before apply
- `npx prisma generate`: passed
- Onboarding/profile tests: passed
- Result: codebase schema is internally consistent, but database application of the prior migration is still blocked and must be retried on the active development database before claiming database completion

## Existing infrastructure reuse map

### Reuse as-is

- Tenant context resolution: `lib/tenant.ts`
- Tenant-scoped Prisma extension: `lib/db/client.ts`
- Central audit logging: `lib/audit.ts`
- Integration credential secret source: `lib/security/env.ts`
- Existing authenticated encryption pattern: `lib/integrations/shared/encryption.ts`
- Durable job queue pattern: `modules/calls/telecom-jobs.ts`
- Safe outbound URL validation: `lib/security/outbound-url.ts`
- Existing action wrapper pattern: `lib/actions/builder.ts`

### Extend

- `prisma/schema.prisma`
  - extended with provider-agnostic integration models instead of overloading telecom `Provider`
- `app/(dashboard)/settings/integrations/page.tsx`
  - extended to show the new marketplace foundation while preserving the existing sales-channel dashboard
- `lib/db/client.ts`
  - extended tenant model allowlist for the new integration tables
- `modules/calls/activation.ts`
  - extended with the activation helper exports expected by existing telecom tests

### Keep separate for now

- `modules/integrations/service.ts`
  - current ecommerce/sales-channel orchestration remains intact
- `lib/integrations/*`
  - current Daraz/Shopify/WooCommerce logic remains channel-specific and is not yet migrated into the new registry
- `VoiceIntegrationSettings`
  - remains voice-specific and should not be treated as the new shared provider model

### Avoid / do not duplicate

- Telecom `Provider`
  - already exists and is not reused for the shared integration catalogue
- `voiceJob`
  - existing durable worker pattern informed the new sync model, but we did not create a second worker runtime yet
- Ad hoc credential handling
  - all new foundation code goes through the shared encrypted vault abstraction

## Security observations

- Good existing foundation:
  - tenant-scoped reads/writes
  - centralized audit helper
  - authenticated encryption secret source
  - webhook-safe URL validation utilities
- Gaps before this task:
  - no shared provider registry
  - no provider-neutral OAuth state storage
  - no shared approval model
  - no common action executor for voice and user-triggered integration calls
  - no provider-neutral voice-tool filtering layer

## Queue and async observations

- Telecom already has:
  - idempotency keys
  - lease expiry
  - heartbeat and timeout fields
  - abandoned-job recovery logic
- New integration sync foundation mirrors those concepts in schema and service design, but a dedicated background worker loop is still future work

## Resulting architecture decision

- Build a new shared integration foundation beside the legacy sales-channel code
- Keep provider definitions code-controlled
- Expose only the development-safe `internal_test` provider as connectable
- Mark all future providers clearly as in development
- Route action execution through one executor with:
  - permission evaluation
  - approval generation
  - credential decryption
  - redacted logging
  - usage tracking
  - health updates
