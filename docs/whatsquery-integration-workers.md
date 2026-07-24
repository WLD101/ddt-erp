# WhatsQuery Integration Workers

## Current worker foundation

The current runtime pass adds worker primitives for:

- sync job leasing
- retry scheduling
- abandoned-job recovery decisions
- event-processing lease expiry checks

## Schema additions

Migration `202607220004_integration_runtime_hardening` adds additive worker fields for:

- `IntegrationSyncJob`
- `IntegrationEvent`
- `TenantIntegration`

These fields support:

- lease owner
- lease expiry
- next attempt timing
- refresh leasing
- dead-letter metadata

## What is still pending

The repository still needs deployment-wired background loops that:

- claim jobs continuously
- heartbeat active work
- recover stale leases
- reschedule failures
- move terminal failures to dead-letter state

That work was not falsely marked complete in this pass.
