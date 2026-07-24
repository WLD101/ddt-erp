# WhatsQuery Integration Action Execution

## Execution path

Implemented in:

- `modules/integrations/foundation-service.ts`

The shared executor performs:

1. tenant integration lookup
2. provider lookup
3. action lookup
4. payload validation
5. permission evaluation
6. approval creation when required
7. credential decryption
8. provider adapter invocation
9. payload redaction
10. action logging
11. usage recording
12. health/state updates

## Why this matters

- provider adapters stay behind one controlled entry point
- voice tooling cannot bypass permissions
- logs remain safe for operational review
- future providers can plug into the same lifecycle
