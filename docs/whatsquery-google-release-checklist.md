# WhatsQuery Google Release Checklist

## Must be true before activation

- direct migration environment can resolve and reach the active database
- pending migrations are applied cleanly
- tenant data verification report is complete
- Google OAuth credentials are configured securely
- encrypted token storage is verified
- Google provider tests pass
- tenant-isolation tests pass
- Gmail send remains disabled by default
- audit logging is present for all write actions
- idempotency is enforced for write actions
- rate limiting is enforced
- unfinished providers remain disabled

## Must not be claimed before verification

- production-ready Google Calendar booking
- production-ready Gmail sending
- production-ready bidirectional sync
- production-ready webhook renewals
- production-ready UK or Pakistan live demo
