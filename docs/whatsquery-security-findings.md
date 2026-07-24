# WhatsQuery Security Findings

Audit date: 2026-07-23

Security release classification: **BLOCKED**

The codebase is materially hardened, but release gates requiring live Contabo,
database, backup/restore, Vapi, and dependency evidence are not satisfied.

## Findings summary

| Severity | Open | Fixed | Accepted risk |
| --- | ---: | ---: | ---: |
| Critical | 2 | 2 | 0 |
| High | 5 | 10 | 0 |
| Medium | 5 | 4 | 0 |
| Low | 2 | 1 | 0 |

## Findings

| ID | Severity | Status | Evidence and exploit scenario | Remediation/verification |
| --- | --- | --- | --- | --- |
| WQ-SEC-001 | Critical | Fixed | `lib/db/client.ts` covered only an older subset of tenant tables. A missed model could be queried without automatic scope. | Complete 112-model scope map and cross-tenant read/update/delete tests added. |
| WQ-SEC-002 | Critical | Fixed | Scoped updates filtered the original tenant but accepted a different tenant in `data`, allowing record transfer through a future loose endpoint. | Tenant write fields are overwritten on create/update/upsert/createMany. |
| WQ-SEC-003 | High | Fixed | WhatsApp POST parsed unsigned JSON. An attacker could forge inbound messages. | Raw-body `X-Hub-Signature-256` HMAC verification and 512 KB limit added. |
| WQ-SEC-004 | High | Fixed | Provider/payment webhooks accepted unbounded bodies and some returned raw errors. | Bounded readers and safe errors added for Vapi, Meta, Stripe, Twilio, and Asterisk. |
| WQ-SEC-005 | High | Fixed | Redis failure fell back to process-local limits in production. Multi-instance abuse was possible. | Production now fails closed; outbound call limit also uses Redis. |
| WQ-SEC-006 | High | Fixed | OAuth state comparisons were non-constant-time and state consumption was raceable. | Constant-time checks, production auth secret requirement, atomic one-time consume. |
| WQ-SEC-007 | High | Fixed | Slow-query logs stored SQL parameters; OTPs were printed outside production. | Query fingerprints replace SQL/params; OTP logging removed; central redaction added. |
| WQ-SEC-008 | High | Fixed | Stored recording URLs could redirect an authorized user to any HTTP(S) host. | HTTPS/private-host validation plus production recording-host allowlist. |
| WQ-SEC-009 | High | Fixed | Soft-deleted/unverified users could pass credentials or MFA completion. | Password, MFA, and session refresh enforce account state. |
| WQ-SEC-010 | High | Fixed | No runtime retention enforcement for recordings/transcripts/messages. | Daily idempotent retention/redaction job added. |
| WQ-SEC-011 | High | Fixed | Worker Compose command was a duplicate app placeholder and unknown jobs completed successfully. | Authenticated poller, leases, resource limits, and fail-closed unknown jobs. |
| WQ-SEC-012 | High | Fixed | Public Vapi status disclosed feature/configuration state. | Public response reduced to generic product health. |
| WQ-SEC-013 | Critical | Open | Workstation `migrate status` reaches a stale cloud pooler, not the live self-hosted Contabo database. Pending/applied migrations and tenant aggregates are unknown. | Run the VPS migration inspect/deploy scripts and preserve redacted output. |
| WQ-SEC-014 | Critical | Open | Backup creation, off-server copy, checksum, and a non-production restore have not been observed. | Verify backup and perform a controlled restore before pilot. |
| WQ-SEC-015 | High | Open | Contabo Docker network, PostgreSQL role/port, firewall, SSH, Studio, pooler, and TLS were not remotely inspected. | Run topology/hardening checklist from the VPS console-safe workflow. |
| WQ-SEC-016 | High | Open | HMAC/timestamp Vapi mode is implemented but no real signed/stale/replay test was run against production. | Configure Vapi HMAC custom credential and execute the controlled webhook test. |
| WQ-SEC-017 | High | Open | `npm audit --omit=dev`: 3 High findings in Next/PostCSS/Sharp after Critical count was reduced to zero. | Upgrade when a supported clean release exists; optimizer is disabled but audit gate remains failed. |
| WQ-SEC-018 | High | Open | Recording consent/disclosure and provider-side private URL behavior are not evidenced for UK/Pakistan production. | Legal/operational owner must verify disclosure, regional policy, and provider settings. |
| WQ-SEC-019 | Medium | Open | No PostgreSQL RLS policies were found. No browser Supabase client was found, so Prisma backend authorization is primary. | Verify exposed schemas/roles; add RLS to any PostgREST-exposed tenant table. |
| WQ-SEC-020 | Medium | Open | URL checks block lexical private hosts but do not pin DNS resolution or revalidate redirects. | Keep Universal REST disabled; add DNS/IP and redirect validation before enabling arbitrary endpoints. |
| WQ-SEC-021 | Medium | Open | Package-specific recording/transcript retention values are not resolved per tenant. | Add tenant policy resolution; global conservative retention is active. |
| WQ-SEC-022 | Medium | Open | Production approval/protected branches and separate migration/deployment workflows cannot be proven locally. | Configure protected GitHub environments and explicit operator approval. |
| WQ-SEC-023 | Medium | Open | Auth.js `Account` token columns are plaintext, although no Auth.js OAuth provider is configured. | Encrypt before enabling social OAuth, or keep credentials-only authentication. |
| WQ-SEC-024 | Medium | Fixed | CSV exports allowed spreadsheet formulas; imports were unbounded. | Formula neutralization and 5 MB/5,000-row server limits added and tested. |
| WQ-SEC-025 | Medium | Fixed | Generic storage helper accepted unsafe file names and unlimited buffers. | File-name normalization, path containment, and 10 MB limit added; no active upload route found. |
| WQ-SEC-026 | Medium | Fixed | Cookie-authenticated mutation APIs lacked a common origin gate. | Central same-origin gate added with narrow callback exemptions. |
| WQ-SEC-027 | Medium | Fixed | Production CSP permitted `unsafe-eval`. | Removed from Next/Nginx production policy. |
| WQ-SEC-028 | Low | Open | CSP still permits `unsafe-inline` scripts/styles. | Move to nonces/hashes in a separately tested frontend change. |
| WQ-SEC-029 | Low | Open | CI action tags are not pinned to immutable commit SHAs. | Pin reviewed GitHub Actions revisions. |
| WQ-SEC-030 | Low | Fixed | Runtime JSON logs were tracked in Git. | Path ignored and existing artifact removed from the index. |

## Release blockers

1. Live Contabo migration state and tenant/schema verification are unknown.
2. No verified backup plus restore evidence exists.
3. Contabo database/network/SSH/Supabase exposure is not verified.
4. Real production Vapi HMAC/timestamp/replay behavior is not verified.
5. Three High production dependency audit findings remain.
6. Recording consent and provider-side privacy controls are not verified.

No finding is marked accepted risk without written owner approval and expiry.

