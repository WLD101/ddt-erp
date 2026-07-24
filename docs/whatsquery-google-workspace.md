# WhatsQuery Google Workspace

## Goal

Use one shared provider connection:

```text
google_workspace
```

This shared provider is intended to cover:

- Google Calendar
- Google Contacts
- Gmail
- Google Sheets

## Current repository state

Implemented in this pass:

- shared provider registry entry
- Google Workspace sandbox adapter
- service-to-provider recommendation aliasing
- shared scope catalogue
- action registry entries for calendar, contacts, email, and sheet-style operations

Relevant files:

- `modules/integrations/core/registry.ts`
- `modules/integrations/core/action-registry.ts`
- `modules/integrations/providers/google-workspace/adapter.ts`
- `modules/integrations/providers/google-workspace/scopes.ts`

## Current limitation

This is still feature-flagged and intentionally not claimed as production-complete. The current adapter is sandbox-oriented foundation code, not a fully live Google OAuth rollout.
