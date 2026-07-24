# WhatsQuery Integration Security

## Implemented protections

- Tenant-scoped data access through `lib/tenant.ts` and `lib/db/client.ts`
- Authenticated credential encryption using AES-256-GCM
- Secret source reuse through `getIntegrationEncryptionSecret()`
- Secret redaction before logging action request/response payloads
- Signed and expiring OAuth state with one-time consumption
- Safe relative redirect-path validation for OAuth callbacks
- Deny-by-default behavior for sensitive actions without an explicit allow path
- Approval generation for high-risk or approval-governed actions
- Redacted API responses only

## Credential lifecycle

1. Credentials enter through backend-only routes.
2. Payloads are encrypted by `modules/integrations/core/vault.ts`.
3. Only encrypted envelopes are stored in `TenantIntegration.encryptedCredentials`.
4. Decryption occurs only inside backend execution paths.
5. Request and response payloads are redacted before persistence.

## Known blocker

The previous onboarding/profile migration is still not applied to the active Supabase development database as of July 22, 2026. The schema files are valid, but database completion cannot be claimed until that migration is successfully applied.
