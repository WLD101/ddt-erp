# WhatsQuery Integration Sync Engine

## Current state

The schema and service foundation for durable sync jobs is now present:

- `IntegrationSyncJob`
- `IntegrationEvent`
- `IntegrationHealthCheck`

The internal test provider also exposes a mock `sync()` capability.

## Not yet complete

- no dedicated production worker loop for integration sync jobs
- no live rate-limit aware scheduling runtime yet
- no dead-letter processor yet

## Reused design ideas

The sync model intentionally mirrors the durable worker patterns already used in:

- `modules/calls/telecom-jobs.ts`

That keeps future worker behavior aligned with:

- idempotency
- retries
- leases
- heartbeat recovery
- timeout handling
