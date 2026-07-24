# WhatsQuery Migration SQL Audit

Date: Thursday, July 23, 2026

| Migration | Additive | Backfill required | Destructive risk | Ready |
| --- | ---: | ---: | ---: | ---: |
| `202607220001_industry_profile_onboarding` | Yes | No | Low | Yes |
| `202607220002_shared_integration_foundation` | Yes | No | Low | Yes |
| `202607220003_market_profile_foundation` | Yes | Yes | Low to medium | Yes, after backup |
| `202607220004_integration_runtime_hardening` | Yes | No | Low | Yes |

## Audit findings

### `202607220001`

Adds nullable industry and onboarding fields to `Organization` and
`OnboardingState`. It does not rewrite existing rows and adds no foreign keys or
indexes. Existing records remain valid with null values.

### `202607220002`

Creates the shared integration tables, tenant-scoped indexes and foreign keys.
All new tables are empty at creation. Required columns apply only to new records.
Foreign keys reference existing `Organization` and `Branch` tables; no existing
row is backfilled into the new tables.

The nullable `IntegrationProvider.organizationId` supports global provider rows.
PostgreSQL permits multiple null values in its composite unique index, so code
must continue to control global provider uniqueness.

### `202607220003`

Adds nullable market fields plus `marketRequiresReview BOOLEAN NOT NULL DEFAULT
true`. It then performs conservative UK/Pakistan inference and copies a confirmed
market into onboarding state.

This is the only migration that updates existing tenant rows. It does not delete
or overwrite unrelated identity or transaction data. Ambiguous tenants retain
`marketRequiresReview = true`. The update may briefly lock the affected
`Organization` and `OnboardingState` rows, so it should run during a quiet window.

### `202607220004`

Adds nullable lease, retry, health and dead-letter metadata and creates
idempotency and rate-limit tables. It does not backfill existing records.

The Prisma schema previously omitted several columns from this migration. The
schema has been corrected before live deployment so generated clients and the
physical migration now agree.

## Pattern scan

The reviewed files contain:

- no `DROP TABLE`;
- no `DROP COLUMN`;
- no `TRUNCATE`;
- no `DELETE FROM`;
- no enum recreation;
- no required new column without a default on an existing table.

## Remaining live checks

- confirm none of the four migrations is partially applied;
- confirm constraint and index names do not already exist outside Prisma history;
- confirm the target is the intended self-hosted production database;
- confirm current tenant aggregates before and after deployment.
