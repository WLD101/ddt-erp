# WhatsQuery Security Architecture

Last reviewed: 2026-07-23

## Request architecture

```text
Browser
  -> Nginx TLS and request limits
  -> Next.js origin/CSRF gate
  -> Auth.js session
  -> server-derived organization and role
  -> tenant-scoped Prisma client
  -> private PostgreSQL
```

Tenant IDs from request bodies, query strings, voice arguments, or unsigned
metadata are not authoritative.

## Voice architecture

```text
Provider webhook
  -> bounded raw body
  -> signature/HMAC and freshness
  -> persistent deduplication event
  -> trusted assistant/phone/existing-call mapping
  -> leased tenant-bound worker job
  -> registered tool
  -> capability and permission decision
  -> confirmation/approval where required
  -> idempotent controlled executor
  -> provider adapter
  -> redacted action and audit records
```

Voice tools receive a resolved organization ID from the event mapping. The model
does not receive a Prisma client, credential vault, administrative API, or
unrestricted HTTP client.

## Identity and session controls

- Auth.js credentials provider with bcrypt password verification.
- Host-scoped, secure production cookies and seven-day JWT expiry.
- MFA/TOTP, encrypted MFA seeds, hashed recovery codes, expiring trusted devices.
- Session-version and security-policy invalidation.
- Soft-deleted/unverified users are rejected at password, MFA, and session refresh.
- Privileged MFA policy defaults to required at the tenant policy layer.
- Password reset responses do not reveal account existence.
- Redis-backed login/OTP/reset rate limits fail closed in production.

## Tenant and role controls

- `getCurrentTenantContext()` derives organization and role from session and membership.
- `getTenantStore()` scopes 102 `organizationId` models and 10 `tenantId` telecom models.
- Tenant filters and tenant write fields override caller-supplied values.
- Runtime provider definitions come from the reviewed static registry; persisted
  tenant provider records remain tenant scoped.
- Branch enforcement remains service-level and is covered by branch tests.
- Platform dashboards read aggregate metrics; no unrestricted transcript/customer
  content query was found in the reviewed admin pages.

## Credential architecture

- Integration credentials use AES-256-GCM with random nonces.
- Encryption keys are production-required and separate from public configuration.
- Decryption occurs only in backend execution context.
- API/action logs store redacted request and response forms.
- Vapi durable payloads are encrypted while replay-safe redacted payloads are retained.
- Environment templates contain placeholders only.

## Browser and API controls

- Unsafe cookie-authenticated API mutations require a trusted Origin/Referer.
- Provider and internal callbacks are narrowly exempt and authenticate independently.
- CSP, frame denial, MIME sniffing denial, strict referrer policy, HSTS, and
  permissions policy are configured.
- Production CSP no longer includes `unsafe-eval`; `unsafe-inline` remains a
  documented Next.js compatibility risk.
- Imports are size/shape limited and CSV formulas are neutralized.

## Data lifecycle

- Daily idempotent worker jobs redact expired recordings, transcripts, Vapi
  payloads, WhatsApp bodies/previews, and notification recipients.
- Defaults: recordings 30 days, transcripts/messages 90 days, webhook payloads
  30 days. Production can shorten these values.
- Tenant package-specific retention overrides are not yet enforced and remain an
  open finding.

## Deployment boundary

The repository Compose file is a standalone PostgreSQL alternative. It is not
evidence of the active self-hosted Supabase topology. The live Contabo deployment
must be inspected using `scripts/contabo-db-topology.sh`; migrations must run on
the VPS/application network with a verified backup.
