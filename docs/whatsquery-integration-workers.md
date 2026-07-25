# WhatsQuery Integration Workers

## Current worker foundation

The current runtime now includes:

- sync job leasing
- sync job claiming and completion
- retry scheduling
- abandoned sync-job recovery
- event claiming and processing
- event dead-letter handling
- one-shot worker execution via `npm run integration:work-once`

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

## Runtime behavior now implemented

- `modules/integrations/runtime-worker.ts` processes due `IntegrationSyncJob` rows using the provider adapter `sync()` contract.
- Stored `IntegrationEvent` rows are claimed through the same worker module and dispatched through the provider adapter `handleEvent()` contract.
- Stale `running` sync jobs are recovered to `abandoned` or `cancelled` based on current row state.
- Stale `processing` events are recovered to `failed` and rescheduled.
- Safe transient failures retry with exponential backoff; terminal event failures move to `dead_lettered`.

## What is still pending

The repository still does not have a full always-on integration operations plane for:

- scheduled health-check sweeps across all connected integrations
- scheduled credential refresh loops
- outbound webhook delivery workers
- deployment-wired long-running worker supervision on the VPS
- provider-specific live Google webhook subscriptions beyond sandbox adapter handling

Those items should remain classified as partial until the VPS runner and live provider wiring are verified.
