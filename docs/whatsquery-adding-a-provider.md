# Adding a Provider

## Current pattern

1. Register the provider in `modules/integrations/core/registry.ts`
2. Reuse existing shared action definitions where possible
3. Add a provider adapter under `modules/integrations/providers/`
4. Implement only the methods the provider actually supports
5. Keep credentials inside the shared vault flow
6. Route execution through `executeIntegrationAction()`
7. Add focused unit tests before exposing the provider in the marketplace

## Minimum checklist

- registry definition
- adapter implementation
- connection test
- scope handling
- resource listing if applicable
- action execution if applicable
- health behavior
- redaction-safe logs
- approval behavior where relevant
- docs and tests

## Important rule

Do not mark a provider as working in the marketplace until:

- real adapter logic exists
- tests pass
- the provider can complete at least one real lifecycle path end to end
