# WhatsQuery Provider Contract

## Contract

All shared providers implement the optional-capability contract in:

- `modules/integrations/core/contracts.ts`

Core methods:

- `testConnection`
- `disconnect`
- `getResources`
- `executeAction`
- `sync`
- `refreshCredentials`
- `subscribeWebhooks`
- `unsubscribeWebhooks`

## Design rules

- Provider definitions remain code-controlled in the registry
- Unsupported capabilities stay unimplemented instead of becoming no-op stubs
- Provider code receives a secure execution context and never infers tenant scope from request payloads
- Frontend and voice-agent code do not call adapters directly

## Internal test provider

The reference implementation is:

- `modules/integrations/providers/internal-test/adapter.ts`

It proves:

- connection testing
- mock resource listing
- read action
- write action
- simulated expiry
- simulated provider outage
- simulated rate limiting
- simulated refresh
- simulated sync
