# WhatsQuery OAuth Security

Last reviewed: 2026-07-23

## Implemented controls

- Cryptographically random state identifier.
- HMAC-signed state using the production-required auth secret.
- PKCE S256 verifier/challenge.
- Encrypted verifier storage.
- Ten-minute default state expiry.
- Tenant, user, provider, and relative redirect binding.
- Constant-time signature verification.
- Atomic one-time consumption with expiry condition.
- Encrypted provider access/refresh tokens in the integration vault.
- Granted scope and selected resource persistence.
- Provider state, action scope, permission, approval, and rate checks.

Unsafe redirects reject absolute URLs, scheme-relative paths, backslashes, and
parent traversal.

## Tests

The integration suite covers valid one-time consumption, reuse, expiry, wrong
tenant, wrong provider, and unsafe redirect. Credential-vault tests cover
encryption/decryption and authenticated-encryption tampering.

## Open items

- Production Google authorization-code exchange, partial scope, token refresh,
  revoke, reconnect, and scope-upgrade tests require real sandbox credentials.
- Auth.js `Account` access/refresh columns are plaintext. No Auth.js social OAuth
  provider is configured; do not enable one until those tokens are encrypted or
  an approved managed-token design is used.
- Production OAuth callback URLs and provider-console allowlists are unverified.

## Release rule

Only providers with an implemented adapter, explicit scopes, encrypted
credentials, disconnect/revocation behavior, and a successful sandbox run may be
enabled. UI feature flags are not authorization controls.

