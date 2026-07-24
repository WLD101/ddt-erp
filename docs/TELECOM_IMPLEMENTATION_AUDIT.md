# WhatsQuery Telecom Implementation Audit

Date: 2026-07-10

Scope: Pakistan local SIP/Asterisk routing plus USA/UK Twilio routing for WhatsQuery Voice. This audit inspects the existing implementation and identifies the smallest safe Phase 1 upgrades needed before production calling.

## Current Completion And Security Audit

For the latest evidence-based completion scoring, production-blocker analysis, validation results, and security findings, see `docs/TELECOM_COMPLETION_AND_SECURITY_AUDIT.md`.

## Capability Matrix

| Capability | Status | Existing files | Problems | Required action |
| --- | --- | --- | --- | --- |
| Prisma telecom tables | Partially implemented | `prisma/schema.prisma`, `prisma/migrations/202607090002_country_call_routing/migration.sql` | Tables exist for providers/rules/numbers/routes/logs, but no logical call, provider attempt, immutable event, idempotency, replay nonce, or state-transition history. | Extend schema incrementally with `Call`, `CallAttempt`, `CallEvent`, and Asterisk nonce tracking. |
| E.164 normalization | Implemented but not production-ready | `modules/calls/phone.ts` | Manual prefix handling accepts invalid numbers, treats all `+1` as USA, and cannot classify NANP countries correctly. | Use a phone parsing library and return structured normalized phone data. |
| Country routing PK/US/GB | Partial | `modules/calls/service.ts` | Routes by prefix/rule but does not consider tenant status, caller ID authorization, provider health, or feature flags consistently. | Add a central routing engine with traceable decisions. |
| Provider adapters | Partial | `modules/calls/providers/*` | Adapter interface exists, but raw status mapping is loose and provider attempts are not represented separately. | Preserve adapters and add normalized event/state handling around them. |
| `/api/calls/initiate` | Implemented but unsafe | `app/api/calls/initiate/route.ts` | No durable idempotency; duplicate retries can create multiple provider attempts. Response uses nonstandard `ok`. | Add tenant-scoped idempotency key and structured response. |
| Call idempotency | Missing | None | Duplicate paid calls possible on retry/double click/concurrent requests. | Add `tenant_id + idempotency_key` uniqueness and request fingerprint conflict detection. |
| Logical call model | Missing | Existing `call_routes`, `call_logs` | Current records mix route decisions and provider outcomes; no durable “intent”. | Add `Call` model and link routes/logs where safe. |
| Provider attempts | Missing | Existing `call_logs` | Cannot represent fallback attempts or multiple provider attempts cleanly. | Add `CallAttempt`. |
| Provider events | Missing | Existing webhook upsert into `call_logs` | Duplicate/out-of-order webhooks are not stored immutably. | Add `CallEvent` with deterministic provider event ID. |
| Call-state machine | Missing | `modules/calls/service.ts` | Status strings are updated directly and can regress from final states. | Add central transition service and tests. |
| Twilio webhook signature | Partial | `modules/calls/providers/TwilioProvider.ts`, `modules/calls/service.ts` | Uses Twilio-style HMAC, but rotation and trusted proxy concerns need hardening; event dedupe missing. | Keep validation, add event idempotency and exact external URL documentation. |
| Asterisk webhook security | Implemented but unsafe | `modules/calls/service.ts`, `app/api/calls/provider-webhook/asterisk/route.ts` | Shared secret only; no HMAC, timestamp, nonce, or replay protection. | Add HMAC signature, timestamp, nonce, raw-body validation, and nonce persistence. |
| Tenant isolation | Partial | API routes and service queries | Tenant routes mostly scope by tenant; webhook mapping can fall back to a generic active provider, though tenant mapping still rejects unknown tenant. Phone lookup by number is not guaranteed unique across providers. | Ensure tenant-owned reads include tenant; require exact provider/call/number mapping; no first tenant fallback. |
| Caller-ID authorization | Partial | `verifyTenantPhoneNumber`, `initiateCountryRoutedCall` | Caller ID can be passed as raw `from` without verifying tenant ownership/status. | Add caller-number selection policy. |
| Rate limiting | Implemented but not production-ready | `modules/calls/service.ts` | In-memory only; not durable across processes/restarts. | Keep as MVP hook, document and plan durable Redis/BullMQ integration. |
| Blocked destinations | Partial | `modules/calls/phone.ts` | Prefix list only; no policy actions or tenant-specific rules. | Add stable rejection codes now; keep fuller policy for Phase 2. |
| Fallback handling | Partial | `modules/calls/service.ts` | Fallback retries on any thrown error, including policy/auth errors. | Classify failures and only fallback on temporary provider failures. |
| Queue/job processing | Missing for telecom | `package.json` includes BullMQ/ioredis; voice jobs exist elsewhere | Telecom initiation/webhook handling is synchronous. | Add a minimal job abstraction later; do not introduce second queue system. |
| Env validation | Partial | `.env.example`, `.env.production.example` | Flags exist; no central validation for enabled provider credentials. | Add server-only telecom env validation. |
| Audit logging | Partial | `AuditLog`, `saveRoutingRule` | Routing changes are logged only when tenant context exists; rejected webhooks and number assignments not consistently audited. | Add safe audit calls for number verification and routing changes; avoid secrets. |
| Tests | Missing for telecom | `tests/security/*.test.ts` | No telecom unit tests. | Add tests for phone parsing, state machine, Asterisk HMAC, idempotency fingerprint, failure classification. |
| Admin routing dashboard | Partial | `app/(voice)/voice/admin/routing/page.tsx` | Read-only status; no simulator, provider health, failure summaries, or feature flag visibility. | Improve after critical Phase 1. |
| Tenant number management | Partial | `app/(voice)/voice/dashboard/numbers/page.tsx` | Can request verification but not default/release/disable numbers; no caller-ID policy details. | Improve after critical Phase 1. |

## Critical Before Production

1. Replace manual number parsing with validated phone-number parsing.
2. Add durable tenant-scoped call idempotency.
3. Add logical calls, attempts, and immutable events.
4. Add central call-state transition service.
5. Make webhook ingestion idempotent and replay-safe.
6. Harden Asterisk webhook validation with HMAC/timestamp/nonce.
7. Enforce caller-ID ownership and verification before outbound calls.
8. Classify failures so fallback is only used for temporary provider failure.

## Important Operational Improvements

1. Add provider health records and health signals.
2. Add route simulator endpoint and UI.
3. Add route priority/weighting for multiple providers.
4. Add call explorer with filters and event timeline.
5. Move rate limits and call jobs to the existing BullMQ/ioredis stack when deployment Redis is ready.
6. Add structured telemetry with `callId`, `attemptId`, `tenantId`, `providerId`, and `requestId`.

## Later Commercial Features

1. Provider cost and customer charge snapshots.
2. Tenant spending limits and wallet reservation.
3. Recording/transcription retention policies.
4. Fraud scoring and premium-rate controls.
5. Usage invoices and detailed analytics.

## Implementation Principle

The existing provider/routing foundation should be preserved. The next work should extend the current schema and `modules/calls` services rather than introducing duplicate APIs or a second provider abstraction.

## Phase 1 Integration Verification

| Item | Status | Notes |
| --- | --- | --- |
| `/api/calls/initiate` creates `Call` and `CallAttempt` | Confirmed complete | Real initiation now creates the logical call, first provider attempt, legacy route projection, and legacy call-log projection. |
| Old `call_logs` and `call_routes` still written | Confirmed complete | They remain compatibility projections for older screens and reports. |
| Old/new model responsibility conflict | Partial | The new lifecycle models are the source of truth, but some screens still read legacy `call_logs`/`call_routes`. Phase 2 documents this as compatibility projection. |
| Twilio webhooks create immutable `CallEvent` | Confirmed complete | Webhook ingestion maps provider call id to `CallAttempt`, stores `CallEvent`, and upserts `call_logs`. |
| Asterisk webhooks create immutable `CallEvent` | Confirmed complete | Asterisk uses HMAC/timestamp/nonce validation before creating the same event records. |
| Webhook dedupe enforced by database | Confirmed complete | `call_events(provider, provider_event_id)` is unique. Duplicate events return safely. |
| Central state transitions | Confirmed complete | `modules/calls/state-machine.ts` is used for initiation and webhook status changes. |
| Fallback attempts create additional `CallAttempt` | Confirmed complete | Temporary provider failures create attempt #2 instead of overwriting attempt #1. |
| Idempotency under concurrent requests | Partial | The database uniqueness constraint is present. Further high-concurrency load testing is still recommended. |
| Caller-ID checks before provider attempt | Confirmed complete | Caller ID is now resolved by the shared routing engine before provider initiation. |
| Tenant isolation on reads/writes | Confirmed complete | Initiation is tenant-scoped. Webhooks map by provider call id or exact provider phone number and never fall back to a first tenant. |
| Terminal states protected against stale webhooks | Confirmed complete | Stale transitions are ignored and logged. |
| Raw webhook payloads redacted | Confirmed complete | Secret-like keys are redacted before storage. |
| Nonce retention strategy | Fixed in Phase 2 | `TelecomWebhookNonce.expiresAt` was added with cleanup support. |

## Legacy Model Transition Plan

Chosen strategy: **Strategy A: Compatibility projection**.

- Source of truth: `Call`, `CallAttempt`, and `CallEvent`.
- Write path: real call initiation writes the new lifecycle records first, then writes `call_routes` and `call_logs` as compatibility projections.
- Read path: new operations and call explorer should prefer lifecycle tables. Legacy dashboards may continue reading `call_routes`/`call_logs` until migrated.
- Compatibility behavior: old tables are not deleted or renamed; they remain useful for existing reports and exports.
- Future deprecation plan: migrate admin call-log screens to `Call` + `CallAttempt` + `CallEvent`, then convert `call_logs` into a reporting projection only.
- Backfill requirements: older `call_logs`/`call_routes` without `call_id` should be backfilled into synthetic logical `Call` records before any legacy read path is removed.
- Dual-write prevention: lifecycle rows are the authoritative state. Legacy rows must not drive state transitions.

## Phase 2 Verification

| Capability | Status | Notes |
| --- | --- | --- |
| Provider health model | Confirmed complete | `ProviderHealthCheck` plus provider health summary fields were added additively. |
| Health evaluation | Confirmed complete | `modules/calls/provider-health.ts` combines manual state, recent attempts, success rate, webhook delay, and capacity. |
| Routing candidates and trace | Confirmed complete | `modules/calls/routing-engine.ts` evaluates the real route path and returns deterministic trace steps. |
| Route simulator | Confirmed complete | `POST /api/admin/routing-rules/simulate` reuses the real routing engine and does not call providers. |
| Provider health APIs | Confirmed complete | Admin-only health list, health-check, and maintenance endpoints are present. |
| Admin dashboard | Partial | Operational sections are added. Deeper filtering/export remains future work. |
| Call explorer | Partial | Admin page shows logical calls and attempts. Full event timeline filtering remains future work. |
| Webhook observability | Confirmed complete | Structured safe console events are emitted for received, duplicate, unknown mapping, stale transition, and processed webhooks. |
| Correlation IDs | Partial | Call initiation passes `callId` as correlation metadata. Full background propagation remains future work. |
| Durable queue | Partial | Existing BullMQ and `VoiceJob` infrastructure exists, but telecom processing remains synchronous and transaction-safe in this phase. |
| Reconciliation | Confirmed complete | Stuck-call reconciliation service marks old non-terminal calls through the state machine and creates a reconciliation event. |
| Nonce cleanup | Confirmed complete | Expired nonce cleanup service deletes only expired rows using `expiresAt`. |

## 2026-07-10 Implementation Update

The earlier audit language above is partially outdated.

Current verified implementation changes:

1. Telecom call initiation is no longer only synchronous.
   It now creates the logical call and first attempt, then durably enqueues `TELECOM_INITIATE_PROVIDER_CALL` in `VoiceJob`.
2. Provider webhooks are now acknowledged quickly and enqueued as `TELECOM_PROCESS_PROVIDER_EVENT`.
3. Fallback execution is now durably enqueued as `TELECOM_EVALUATE_FALLBACK`.
4. The protected voice jobs processor now also schedules and processes telecom jobs for:
   - provider health checks
   - reconciliation
   - webhook nonce cleanup
5. Durable worker behavior is documented in `docs/TELECOM_WORKER_OPERATIONS.md`.
6. The telecom worker now includes:
   - payload schema validation
   - worker-version stamping
   - lease expiry and abandoned-job recovery
   - timeout timestamps
   - operator retry and cancellation support
   - explicit uncertain-provider-response handling without blind retry
   - dead-letter reason visibility through job fields

These changes improve the telecom foundation, but they do not complete the full roadmap.
