# Telecom Worker Operations

## Scope

This document covers the durable telecom job flow implemented in the repository as of July 10, 2026.

It does not claim that the telecom roadmap is complete.

## Durable execution model

Telecom jobs are persisted in `VoiceJob` and processed through the protected `GET` and `POST` handlers at `app/api/voice/jobs/process/route.ts`.

Supported telecom job types:

* `TELECOM_INITIATE_PROVIDER_CALL`
* `TELECOM_PROCESS_PROVIDER_EVENT`
* `TELECOM_EVALUATE_FALLBACK`
* `TELECOM_RECONCILE_CALL`
* `TELECOM_PROVIDER_HEALTH_CHECK`
* `TELECOM_WEBHOOK_NONCE_CLEANUP`
* placeholder-safe reserved job types for future projection, billing, and verification flows

The worker implementation lives in `modules/calls/telecom-worker.ts`.

Queue helpers and idempotency helpers live in `modules/calls/telecom-jobs.ts`.

## Security and safety properties

The worker is fail-closed by design:

* telecom job processing requires the existing `VOICE_JOBS_SECRET`
* outbound initiation rechecks activation controls immediately before provider invocation
* fallback evaluation rechecks activation controls before provider invocation
* webhook jobs are acknowledged quickly and processed asynchronously
* duplicate webhook jobs collapse through durable idempotency keys
* provider-invoking jobs do not auto-retry, to avoid duplicate live call risk

Real calling remains disabled unless the existing environment and activation controls explicitly allow it.

## Recurring jobs

Each authorized worker run also schedules recurring telecom jobs:

* provider health checks in 15-minute buckets
* reconciliation in 60-minute buckets
* webhook nonce cleanup in 60-minute buckets

Bucketed idempotency keys prevent duplicate recurring enqueues within the same window.

## Dead-letter behavior

Jobs that exhaust retry policy are marked `failed` and stamped with `deadLetteredAt`.

Current behavior is intentionally conservative:

* provider-event and housekeeping jobs may retry
* provider-invoking jobs are single-attempt because retries could duplicate external side effects
* operator retry and cancellation are exposed through `app/api/admin/telecom/jobs/route.ts`

## Lease, timeout, and recovery behavior

Telecom jobs now use:

* worker version stamping
* lease expiry timestamps
* timeout timestamps
* cancellation requests
* cancelled timestamps

If a worker dies after claiming a telecom job, the next run first attempts abandoned-job recovery before claiming new work.

Current recovery behavior:

* expired processing leases are moved back to `retrying`
* timed-out processing jobs are moved back to `retrying`
* cancellation requests on in-flight jobs are honored on recovery
* dead-letter reasons remain operator-visible through `failureCode` and `lastError`

## Payload safety

Telecom worker payloads are validated with explicit schemas before execution.

The stored payload format is an envelope with:

* payload version
* job type
* validated data

This reduces the risk of malformed or cross-purpose worker payload reuse.

## Uncertain provider initiation safety

When a provider invocation fails with an uncertain timeout-style error, the worker does not auto-retry and does not immediately create a second provider call.

Instead it:

* preserves the attempt in an in-progress initiation state
* records a `PROVIDER_RESPONSE_UNCERTAIN` failure code
* schedules reconciliation
* avoids automatic fallback based only on timeout uncertainty

## Operational limitations

The following roadmap items are still incomplete or only partially complete:

* dedicated telecom dead-letter UI
* billing finalization worker jobs
* provider verification worker jobs
* legacy projection sync worker jobs
* outbox recovery from partially committed external side effects
* production deployment of a continuously running trusted worker

## Recommended operating pattern

Run the protected job processor from trusted infrastructure on a schedule.

Minimum recommendation:

* every minute for near-real-time webhook and initiation processing
* every 5 to 15 minutes for health checks
* hourly coverage for reconciliation and nonce cleanup
