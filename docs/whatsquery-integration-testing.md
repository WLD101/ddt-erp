# WhatsQuery Integration Testing

Added in this phase:

- profile-registry unit tests in `tests/onboarding/industry-profiles.test.ts`

Still required for later phases:

- provider connect/callback tests
- token refresh tests
- resource-selection tests
- tenant-isolation integration tests for connectors
- voice action approval tests per provider

The testing rule remains:

- no connector should be treated as complete without read/write/sync/isolation coverage
