# WhatsQuery Technical Debt Register

Date: Thursday, July 23, 2026

## Current release checks

| Item | Classification | Current status |
| --- | --- | --- |
| New migration and verification files | Current work | Scoped ESLint passes |
| TypeScript compilation | Release gate | Passes |
| Production build | Release gate | Passes |
| Full repository ESLint | Pre-existing, non-blocking for this migration stage | Fails |
| Build-time database reads | Pre-existing reliability issue | Build succeeds but logs connection failures when the workstation database is unavailable |
| Remotion generated bundles included in ESLint | Pre-existing tooling issue | Produces excessive warnings and slows lint |

## Full lint findings

The full `npm run lint` command currently scans generated Remotion bundle output
and reports a large pre-existing warning set. It also reports source errors,
including React immutability checks such as direct `window.location.href`
assignment in the finance payment client.

These failures were not introduced by the Contabo migration work. The new
JavaScript verification code and modified Redis test pass strict scoped ESLint.

## Recommended follow-up

1. Exclude generated Remotion build output from ESLint.
2. Fix source-level lint errors before making full lint a required CI gate.
3. Mark database-dependent pages as runtime-only or provide an explicit build
   data strategy so production builds do not attempt unavailable database reads.
4. Remove unused imports incrementally without rewriting unrelated working pages.
