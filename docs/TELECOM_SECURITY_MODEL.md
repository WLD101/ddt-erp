# Telecom Security Model

## Current posture

The telecom subsystem is not production-ready.

The current implementation focuses on fail-closed behavior, tenant isolation improvements, webhook safety, and disabled-by-default outbound calling.

## Core controls

### Activation controls

Activation enforcement is implemented in `modules/calls/activation.ts`.

Current guarantees:

* default mode is effectively disabled when no matching control exists
* the most restrictive matching control wins
* emergency stop denies live calling
* destination allowlists are enforced
* provider invocation paths recheck activation before outbound execution

### Tenant isolation

Current protections include:

* provider webhooks resolve by provider-scoped identifiers instead of unsafe first-match fallbacks
* ambiguous webhook mapping is rejected
* tenant pages no longer receive global provider and routing data through the tenant numbers dashboard path
* global provider listing API is platform-admin only and returns an allowlisted response

### Webhook protection

Current protections include:

* Twilio signature validation
* Asterisk HMAC validation
* Asterisk nonce persistence and replay-window enforcement
* deterministic provider event ids
* duplicate provider events are ignored after persistence

## Worker safety

Durable telecom worker processing is implemented through `VoiceJob`.

Current worker guarantees:

* protected processing endpoint
* durable enqueue for outbound initiation
* durable enqueue for provider webhooks
* durable fallback evaluation
* durable reconciliation and nonce cleanup scheduling
* conservative no-retry behavior for side-effecting provider invocation jobs

## Known gaps

The following gaps remain and must not be hidden:

* no external penetration test
* no approved real carrier test
* no production telecom credentials in the repository
* no completed telecom billing control model
* no completed provider verification framework
* no finished role-masked telecom investigation export controls
* no full cross-tenant integration test matrix for every telecom route and worker path

## Safe-default requirement

All environments must remain in `DISABLED`, `SIMULATION_ONLY`, or equivalent safe defaults unless a separate approval process explicitly authorizes a later pilot phase.
