# WhatsQuery Live Tenant Verification

The live verifier reports aggregate values only:

- tenants checked;
- tenants with an industry profile;
- tenants with a valid UK or Pakistan market;
- tenants requiring market review;
- broken integration relations;
- cross-tenant integration mismatches.

It never prints organization names, users, emails, telephone numbers, provider
credentials or integration payloads.

Release is blocked when broken relations or cross-tenant mismatches are non-zero.
Tenants with `marketRequiresReview = true` are not data-integrity failures, but
they require an operator to confirm the market before market-specific automation
is enabled.

Temporary write-based smoke tests must use a clearly labelled sandbox tenant and
must not be run against real customer tenants. They remain a separate controlled
step after the read-only live verification passes.
