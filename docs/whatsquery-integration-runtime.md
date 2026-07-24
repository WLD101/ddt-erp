# WhatsQuery Integration Runtime

## Status

This document describes the runtime hardening layer added on Wednesday, July 22, 2026.

## New runtime protections

### Durable idempotency

Source:

- `modules/integrations/core/idempotency.ts`
- `modules/integrations/foundation-service.ts`

Persisted model:

- `IntegrationActionExecution`

Behavior:

- tenant-scoped idempotency keys
- request-hash validation
- completed-result replay
- failed-request restart with the same request hash
- duplicate in-progress rejection

### Shared durable rate limiting

Source:

- `modules/integrations/core/rate-limit.ts`

Persisted model:

- `IntegrationRateLimitCounter`

Behavior:

- provider-aware windowing
- tenant and connection-aware bucket keys
- safe `429` responses with retry hints

### Worker primitives

Source:

- `modules/integrations/core/workers.ts`

Behavior:

- lease expiry evaluation
- queued-work claim eligibility
- exponential backoff
- retry scheduling helpers

## Current limitation

The helper layer and schema are implemented, but full always-on sync/event worker orchestration still needs the reachable migration environment plus deployment-side runner wiring.
