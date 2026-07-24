# WhatsQuery Threat Model

Last reviewed: 2026-07-23

## Scope

This model covers the WhatsQuery ERP and Voice application, the Vapi and telecom
ingress paths, tenant integrations, background jobs, Prisma, self-hosted Supabase
PostgreSQL on Contabo, billing, support, and administrative surfaces.

## Protected assets

| Classification | Assets |
| --- | --- |
| Highly sensitive | Database and encryption keys, OAuth refresh tokens, provider credentials, Vapi/Twilio/WhatsApp secrets, MFA seeds, administrator sessions |
| Confidential | Call recordings, transcripts, caller numbers, customer/contact records, WhatsApp messages, payment metadata, health-adjacent administrative data |
| Internal | Prompts, routing rules, provider health, job payloads, audit/security events, pricing and operational configuration |
| Public | Marketing content, published pricing, public status response, documentation |

## Trust boundaries

1. Internet browser to Next.js/Nginx.
2. Vapi, Twilio, Asterisk, Stripe, and Meta to public webhook routes.
3. Authenticated session to tenant and branch context.
4. Voice event to trusted assistant/phone/call mapping.
5. Voice tool to permission and approval engine.
6. Application to Redis, PostgreSQL, provider APIs, and object storage.
7. Worker poller to the authenticated internal job endpoint.
8. Deployment operator/CI to the Contabo host and migration role.
9. Platform administration to aggregate tenant operations.

## Entry points

- Authentication, password reset, OTP, invitation, lead, and demo forms.
- Cookie-authenticated API routes and server actions.
- Provider webhooks and Vapi tool calls.
- OAuth initiation/callback and encrypted credential storage.
- CSV/XLSX import payloads and export downloads.
- Call recording redirect endpoint.
- Worker and reconciliation triggers.
- Nginx, SSH, Docker, PostgreSQL, Supabase services, and deployment scripts.

## Privileged operations

- Tenant membership and role changes.
- Provider connection, credential decryption, and action execution.
- Calls, messages, email, payment links, exports, refunds, and approvals.
- Recording/transcript access and data deletion.
- Feature activation, emergency stop, routing, billing, and migrations.

## Threat actors

- Unauthenticated users and automated bots.
- Compromised or malicious tenant users and tenant administrators.
- Cross-tenant attackers.
- Holders of leaked API keys or OAuth tokens.
- Forged or replayed webhook senders.
- Malicious integration endpoints.
- Compromised VPS, CI, provider, or administrator accounts.
- Insiders with limited platform or infrastructure access.

## Credible attack paths

| Path | Consequence | Severity | Primary controls | Status |
| --- | --- | --- | --- | --- |
| Missing tenant filter or tenant-ID mass assignment | Cross-tenant read/write | Critical | Complete Prisma extension, trusted context, ownership tests | Fixed and locally tested |
| Forged Vapi/Meta/telecom webhook | Calls/actions/messages under another identity | Critical | HMAC/signature, timestamp, nonce/dedup, trusted mapping | Implemented; real Vapi delivery not production-verified |
| Stolen provider credential | Provider/API impersonation | Critical | AES-256-GCM vault, server-only decryption, redaction | Locally tested; production key custody unverified |
| Unverified migration or backup | Data loss or inconsistent tenant schema | Critical | audited migration script, backup prerequisite, checksum, live verifier | Open production blocker |
| Compromised tenant session | Unauthorized ERP/recording access | High | bcrypt, MFA policy, session version, secure cookie, role checks | Implemented; external test pending |
| OAuth state replay or tenant swap | Credential attached to wrong tenant | High | PKCE, HMAC state, expiry, atomic consumption, binding | Fixed and locally tested |
| SSRF through a connector URL | Internal service or metadata access | High | HTTPS/private-host checks, connector allowlists | Universal REST absent/disabled; DNS rebinding defense remains open |
| Log/query leakage | Tokens, caller data, DB data exposed to operators | High | centralized redaction, query fingerprints, retention | Fixed locally; production log pipeline unverified |
| Public/stolen recording URL | Confidential audio disclosure | High | tenant role check, HTTPS, host allowlist, retention | Implemented; provider-side URL policy unverified |
| Dependency compromise | Remote compromise or DoS | High | lockfile, CI audit, patch upgrades, image optimizer disabled | Three High audit findings remain open |
| Formula/import abuse | Spreadsheet execution or resource exhaustion | Medium | formula neutralization and server-side limits | Fixed and tested |
| VPS account compromise | Full platform compromise | Critical | key-only SSH, firewall, least privilege, backups | Not remotely verified |

## Security assumptions

- Production traffic terminates at an authenticated, patched Nginx/TLS proxy.
- Prisma is the only application data path; no browser Supabase client was found.
- `DIRECT_URL` is private or loopback/Docker-network only.
- Production sets unique auth, encryption, webhook, worker, and database secrets.
- Incomplete providers and Universal REST remain disabled.

These assumptions must be verified on Contabo before pilot approval.

## Verification

Evidence is recorded in `docs/whatsquery-security-findings.md` and
`docs/whatsquery-security-release-checklist.md`. This is a point-in-time threat
model, not a claim that the platform is completely secure.

