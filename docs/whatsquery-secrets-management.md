# WhatsQuery Secrets Management

Last reviewed: 2026-07-23

## Secret classes

- Auth/session and MFA encryption secrets.
- Integration credential encryption key and key version.
- Vapi, Twilio, Asterisk, Meta, Stripe, Google, email, storage, and worker secrets.
- Database, Redis, backup, SSH, and CI credentials.

## Implemented controls

- Production helpers fail when auth or encryption keys are absent.
- Integration credentials use AES-256-GCM, random nonce, authenticated tag, and
  versioned envelopes.
- Vapi durable payloads use authenticated encryption.
- OAuth PKCE verifier is encrypted.
- Recovery codes, invitation/OTP/reset-style tokens are hashed where implemented.
- Central log redaction masks sensitive keys, bearer values, JWTs, and connection
  passwords.
- Client-facing integration records do not include plaintext vault contents.
- `.env*` files are ignored except committed placeholder templates.

## Secret scan result

- Current tracked/high-confidence private-key/API-key scan: no real match found.
- Git-history high-confidence scan: no match found.
- Example database URLs matched the connection-string detector and contain
  placeholders only.
- A tracked runtime log was removed from the Git index and the directory ignored.
- The scan is not a substitute for a dedicated CI secret scanner.

## Rotation requirements

Rotate immediately after suspected disclosure:

1. Contain the affected provider/feature.
2. Create a replacement in the provider or vault.
3. Deploy the replacement without logging it.
4. Revoke the old credential.
5. Re-encrypt stored credentials when the vault key changes.
6. Verify calls/webhooks/workers, then record a redacted audit event.

Database credential rotation requires a coordinated app connection drain.
Encryption-key loss requires restoring the protected key backup or reconnecting
each provider; never commit recovery keys.

## Production requirements

- Store secrets in root-owned environment files or an approved secret manager.
- Separate test and production provider accounts/secrets.
- Restrict CI secrets to protected production environments with approval.
- Never pass full secrets in command output, tickets, screenshots, or alerts.
- Assign an owner and rotation date to every production secret.

