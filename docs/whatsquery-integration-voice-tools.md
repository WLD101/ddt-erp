# WhatsQuery Integration Voice Tools

## Goal

Voice agents should only see tools that are:

- connected
- provider-supported
- industry-compatible
- scope-valid
- permission-allowed

## Implemented layer

- `modules/integrations/core/voice-tools.ts`

## Safety rules

- voice models never receive raw credentials
- voice models never receive unrestricted provider clients
- denied actions are hidden before exposure
- approval-requiring actions remain marked as such
- execution still routes through the shared action executor

## Current provider support

- `internal_test` only

Future voice-enabled providers will inherit the same filter path.
