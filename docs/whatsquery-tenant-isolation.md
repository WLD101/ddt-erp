# WhatsQuery Tenant Isolation

Last reviewed: 2026-07-23

## Authority

Tenant authority comes from the authenticated user, their membership, and the
server-created `TenantContext`. Request bodies, query parameters, voice-model
arguments, caller metadata, and unsigned provider metadata are not tenant
authority.

## Prisma enforcement

`lib/security/tenant-scope.ts` maps:

- 102 models whose scope column is `organizationId`.
- 10 telecom models whose scope column is `tenantId`.

`lib/db/client.ts` applies that scope to reads, aggregates, updates, deletes,
upserts, and bulk operations. Write payloads are overwritten with the trusted
tenant value to prevent tenant reassignment.

Runtime provider definitions come from the reviewed static registry. Persisted
`IntegrationProvider` records remain tenant scoped. Any future global provider
override or raw/unscoped query requires explicit security review.

## Sensitive assets covered

The regression suite explicitly exercises Customer, VoiceCallLog,
TenantIntegration, IntegrationOAuthState, AuditLog, IntegrationApprovalRequest,
VoiceJob, and VoiceWebhookEvent for read, update, and delete scope. Telecom Call
and related models use `tenantId`.

Branch access remains a second service-layer control. Staff are denied another
branch; owner/admin cross-branch access is explicit.

## Worker and webhook isolation

- Vapi tenant resolution uses trusted assistant ID, phone-number ID, inbound
  number, or an existing call mapping.
- An unresolved event is marked `mapping_failed`; caller metadata is not allowed
  to choose a tenant.
- Voice and telecom jobs persist tenant identity and use atomic lease claims.
- Integration jobs and approvals are queried through the tenant store.
- Provider event/idempotency keys prevent duplicate operational outcomes.

## Residual risks

- The live schema has not been compared with the committed Prisma schema.
- No RLS policy migrations were found. This is acceptable only while tenant
  tables are inaccessible from browser/anonymous PostgREST roles.
- Prisma nested writes and every future raw query still require review; the
  extension is not a substitute for route/service authorization.
- Production database-backed cross-tenant tests are pending because the local
  `.env` targets the wrong database.

## Required production verification

1. Run migrations and `scripts/verify-live-database.mjs` on Contabo.
2. Create two disposable pilot tenants.
3. Attempt cross-tenant customer, call, integration, credential, audit, approval,
   webhook replay, worker claim, and branch access.
4. Confirm 404/403 responses and corresponding safe security events.
5. Remove the disposable records and retain only redacted test evidence.
