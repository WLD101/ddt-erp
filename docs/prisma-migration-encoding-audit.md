# Prisma Migration Encoding Audit

Audit date: 2026-07-25

Repository branch: `fix/prisma-migration-encoding-recovery`

Base commit: `3cd8a0602b0dbc7891ea249042ea9bb0bb1d30d5`

## Result

All 27 migration directories contain a non-empty `migration.sql`. After the
recovery described below, every file:

- decodes as strict UTF-8;
- has no BOM;
- has zero null bytes;
- is not likely BOM-less UTF-16LE or UTF-16BE;
- uses LF line endings in the canonical Git checkout;
- contains readable SQL by keyword/control-character heuristic.

Command:

```bash
npm run migration:encoding-check
```

Result:

```text
Prisma migration encoding check passed: 27 migration file(s).
```

## Root cause

`202607100003_telecom_phase3_launch_readiness/migration.sql` was already
corrupted when first committed in `745615a`. Its Git blob was 7,166 bytes made
entirely of `0x00`; it was not meaningful UTF-16LE text. The untracked
`migration.sql.utf16-backup` had the same all-null content and was not a valid
recovery source.

Commit `3cd8a06` attempted to normalize that all-null file. The resulting blob
was 3,583 bytes made entirely of `0x00`, consistent with treating pairs of null
bytes as UTF-16 code units and writing one UTF-8 null byte per code unit. Prisma
then failed with P3018 because the query contained embedded null characters.

No SQL was reconstructed from `schema.prisma`.

## Recovered source

Git's unreachable object database contained a complete staged snapshot at the
exact target path:

```text
blob c4e838c9fb8bac66671b6b9f214cee51324b5e6c migration.sql
tree a7d478588a98dd9c55bc4a070718a5f4943ca6ef 202607100003_telecom_phase3_launch_readiness
tree b3c827e7f3ed51ba4a60d5e961e81c9d9b13d185 migrations
tree ff29c0a83044a9148a2fb6e744aa403f8b925513 prisma
```

No commit references that staged tree. The blob is nevertheless a high
confidence original because it:

- occupies the exact migration path in Git trees;
- is exactly 7,166 bytes, matching the pre-repair file size;
- begins with `-- Phase 3 telecom launch readiness.`;
- contains 174 lines of coherent additive SQL;
- has zero null bytes, no BOM and LF-only line endings;
- hashes to SHA-256
  `499449c342f41ea475d6d96e896ac80dcd5c50f2d4aa2c046ba8a55e718546ff`.

The repaired tracked file hashes back to the same Git blob
`c4e838c9fb8bac66671b6b9f214cee51324b5e6c`, proving it was restored
byte-for-byte without semantic edits.

## Historical candidates

| Reference | Blob | Bytes | Null bytes | First bytes | Encoding/readability | Decision |
| --- | --- | ---: | ---: | --- | --- | --- |
| `745615a`, `2a9993f`, `29af25b`, local/remote release branch | `c689e8d835399e26a8459b62b87cb98cea427509` | 7166 | 7166 | `00 00 00 00 00 00 00 00` | All-null; not readable UTF-16 | Reject |
| `3cd8a06`, `main`, `origin/main` | `2c135cc3e937e81326f53be5c779c41450eb2cf6` | 3583 | 3583 | `00 00 00 00 00 00 00 00` | All-null | Reject |
| `codex/saas-onboarding-security` and remote counterpart | None | N/A | N/A | N/A | Migration absent | Not a candidate |
| Unreachable staged Git tree at exact migration path | `c4e838c9fb8bac66671b6b9f214cee51324b5e6c` | 7166 | 0 | `2d 2d 20 50 68 61 73 65` | UTF-8, LF, readable SQL | Selected |

Forensic copies are outside the repository under
`C:\Users\WLD10\.codex\forensics\whatsquery-prisma-3cd8a060`. Backup artifacts
inside migration directories are ignored by `.gitignore` and are not release
files.

## Canonical line endings

The Windows checkout had `core.autocrlf=true`, which displayed 15 valid tracked
LF blobs as CRLF working files. Raw `HEAD` blob inspection proved their canonical
Git bytes were already LF. `.gitattributes` now enforces LF for every
`prisma/migrations/**/migration.sql` checkout.

This line-ending enforcement does not alter the Git blobs or checksums of
already-applied migrations. Only the failed `202607100003` migration has changed
canonical content in this recovery branch.

## Production history classification

| Migration status | Migrations | Checksum treatment |
| --- | --- | --- |
| Explicitly reported applied | `202607090001`, `202607090002`, `202607100001`, `202607100002` | SQL blobs are unchanged by this branch |
| Failed in production | `202607100003_telecom_phase3_launch_readiness` | Recovered checksum differs from failed all-null checksum; resolve only the failed record as rolled back after checking for partial artifacts |
| Pending after the failed migration | `202607100004`, `202607100005`, `202607220001` through `202607240001` | Canonical Git SQL is unchanged |
| Not identified by supplied deployment log | Migrations before `202607090001` | No production claim; canonical Git SQL is unchanged |

Do not use `prisma migrate resolve` for any successfully applied migration.
Do not edit `_prisma_migrations` manually. The only permitted resolution in the
deployment runbook is `--rolled-back
202607100003_telecom_phase3_launch_readiness`, and only when its latest record is
still failed and no partial Phase 3 artifacts exist.

## Complete file audit

The SHA-256 values below are for canonical LF working files after recovery.

| File | Bytes | SHA-256 | First 32 bytes in hex | BOM | Nulls | EOL | UTF-8 | Readable SQL |
| --- | ---: | --- | --- | --- | ---: | --- | --- | --- |
| `202605060001_initial/migration.sql` | 61746 | `66d4e9fd44070feb594ad17367b3a24a4b7aac8ea7f21297cd8bcc688b251e15` | `2d 2d 20 43 72 65 61 74 65 54 61 62 6c 65 0a 43 52 45 41 54 45 20 54 41 42 4c 45 20 22 55 73 65` | none | 0 | LF | Yes | Yes |
| `202605120001_stripe_billing/migration.sql` | 1001 | `337d57b7bf631c4764b45d28a61140db378a8316225717c1ecd1036db0ed0d9e` | `2d 2d 20 53 74 72 69 70 65 20 62 69 6c 6c 69 6e 67 20 73 75 70 70 6f 72 74 20 66 6f 72 20 73 65` | none | 0 | LF | Yes | Yes |
| `202605140001_product_units/migration.sql` | 171 | `1fcf3a4dea5cece652040a6ec532e16a62d71387b782f2369fd1014295be85aa` | `2d 2d 20 50 72 6f 64 75 63 74 20 75 6e 69 74 20 6d 65 74 61 64 61 74 61 20 66 6f 72 20 72 65 61` | none | 0 | LF | Yes | Yes |
| `202605160001_customer_status_for_assistant/migration.sql` | 75 | `3170f3ce73d0bb762a69a402e56bddd04a27518d8355e57f5398f70b6ada157e` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 43 75 73 74 6f 6d 65 72 22 0a 41 44 44 20 43 4f 4c 55 4d` | none | 0 | LF | Yes | Yes |
| `202605170001_auth_security_foundation/migration.sql` | 6147 | `fbff983c76f89cf4a15bd499463a59dfbd24e57c3deccdba5852a177079e5201` | `2d 2d 20 41 64 64 69 74 69 76 65 20 73 65 63 75 72 69 74 79 20 66 6f 75 6e 64 61 74 69 6f 6e 20` | none | 0 | LF | Yes | Yes |
| `202605300001_voice_receptionist_foundation/migration.sql` | 5771 | `54f91094beffa693763b80fd76091d3edc5a23914c66bc9348d37dc0b5211214` | `2d 2d 20 41 64 64 69 74 69 76 65 20 76 6f 69 63 65 20 72 65 63 65 70 74 69 6f 6e 69 73 74 20 66` | none | 0 | LF | Yes | Yes |
| `202605310001_voice_vapi_foundation/migration.sql` | 682 | `c74d23c7dbc56e8f01c3929e4d16e1f97effbe0a5f8fb29ce70eb6bfdf7a7be2` | `2d 2d 20 41 6c 74 65 72 54 61 62 6c 65 0a 41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65` | none | 0 | LF | Yes | Yes |
| `202606020001_voice_vapi_demo_mapping/migration.sql` | 483 | `44405e687f51ba12dd74d81eb280126ddfc659b897363ae135992bd1ea221018` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65 49 6e 74 65 67 72 61 74 69 6f 6e 53 65 74` | none | 0 | LF | Yes | Yes |
| `202606030001_voice_training_profile/migration.sql` | 5858 | `9fae7d74ec7dbcd7990421cca540fab7363831346f91295477ba84345a523c2b` | `2d 2d 20 41 64 64 69 74 69 76 65 20 74 65 6e 61 6e 74 2d 73 63 6f 70 65 64 20 74 72 61 69 6e 69` | none | 0 | LF | Yes | Yes |
| `202606030002_voice_agent_mapping/migration.sql` | 2664 | `97c8aa467ae831e7ff97fe0bd1d449f344f4fb26512551d283e1be8316e19ec4` | `2d 2d 20 41 64 64 69 74 69 76 65 20 6d 75 6c 74 69 2d 61 67 65 6e 74 20 6d 61 70 70 69 6e 67 20` | none | 0 | LF | Yes | Yes |
| `20260605132800_voice_no_interruption_capacity_and_routing/migration.sql` | 2795 | `ce72e3415715f3383bb843fabd14b42e584dec3c5e7bed44b93301ba268ca8cd` | `2d 2d 20 41 6c 74 65 72 54 61 62 6c 65 0a 41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65` | none | 0 | LF | Yes | Yes |
| `202606060001_voice_naming_and_cost_tracking/migration.sql` | 1189 | `4b21e07da959e4771661779519405805868f8766dc28afea81541ff0e79e31fd` | `2d 2d 20 41 64 64 20 74 65 6e 61 6e 74 2d 73 61 66 65 20 6e 61 6d 69 6e 67 20 61 6e 64 20 63 6f` | none | 0 | LF | Yes | Yes |
| `202606290001_voice_call_metrics_demographics/migration.sql` | 422 | `ef0c215764031ca1f5eda60354639824f7f2dc0327cc45bb39ff6306d19180d3` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65 43 61 6c 6c 4c 6f 67 22 0a 41 44 44 20 43` | none | 0 | LF | Yes | Yes |
| `202606290002_tenant_support_requests/migration.sql` | 1292 | `44eb1b83a76063bf51b5759ed3790d8e3d921744e9ad96bc419d2014eccebcdf` | `43 52 45 41 54 45 20 54 41 42 4c 45 20 22 53 75 70 70 6f 72 74 52 65 71 75 65 73 74 22 20 28 0a` | none | 0 | LF | Yes | Yes |
| `202607090001_voice_whatsapp_channel/migration.sql` | 8952 | `d919b1d9698c001e1f8a2ad7555d030200d5d9bf0ac965771fa935287291d0d3` | `2d 2d 20 57 68 61 74 73 51 75 65 72 79 20 56 6f 69 63 65 20 57 68 61 74 73 41 70 70 20 63 68 61` | none | 0 | LF | Yes | Yes |
| `202607090002_country_call_routing/migration.sql` | 5330 | `508f33be829db00b3511cb630c3c3c3b36e600001829e3703532dce5ee1de111` | `2d 2d 20 43 6f 75 6e 74 72 79 2d 62 61 73 65 64 20 74 65 6c 65 63 6f 6d 20 72 6f 75 74 69 6e 67` | none | 0 | LF | Yes | Yes |
| `202607100001_telecom_call_lifecycle/migration.sql` | 6603 | `94ef66ece474b6d9c4d9c2f6aabddcc0e530625d46738bf02d2153317507f4da` | `2d 2d 20 41 64 64 20 64 75 72 61 62 6c 65 20 74 65 6c 65 63 6f 6d 20 63 61 6c 6c 20 6c 69 66 65` | none | 0 | LF | Yes | Yes |
| `202607100002_telecom_operational_readiness/migration.sql` | 3993 | `f7ec81e260aaff53dfc605efa819bb1e83d9bec798f80965e8d96686563c89d9` | `2d 2d 20 50 68 61 73 65 20 32 20 74 65 6c 65 63 6f 6d 20 6f 70 65 72 61 74 69 6f 6e 61 6c 20 72` | none | 0 | LF | Yes | Yes |
| `202607100003_telecom_phase3_launch_readiness/migration.sql` | 7166 | `499449c342f41ea475d6d96e896ac80dcd5c50f2d4aa2c046ba8a55e718546ff` | `2d 2d 20 50 68 61 73 65 20 33 20 74 65 6c 65 63 6f 6d 20 6c 61 75 6e 63 68 20 72 65 61 64 69 6e` | none | 0 | LF | Yes | Yes |
| `202607100004_telecom_worker_hardening/migration.sql` | 402 | `3a558725f3e4067d94e1cea0799a223d754abfd3bd41f4757be802c1986043ae` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65 4a 6f 62 22 0a 41 44 44 20 43 4f 4c 55 4d` | none | 0 | LF | Yes | Yes |
| `202607100005_telecom_activation_pilot_controls/migration.sql` | 2256 | `5067438cc1616a0ce18b6a6dc9f3d45bcb123b8f02aeab75c8292e6132a7d24c` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 70 68 6f 6e 65 5f 6e 75 6d 62 65 72 73 22 0a 41 44 44 20` | none | 0 | LF | Yes | Yes |
| `202607220001_industry_profile_onboarding/migration.sql` | 179 | `3fc05261337c2e4787c1c1321ea31c369345d5850e794d6b818cedb194b88f43` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 4f 72 67 61 6e 69 7a 61 74 69 6f 6e 22 0a 41 44 44 20 43` | none | 0 | LF | Yes | Yes |
| `202607220002_shared_integration_foundation/migration.sql` | 16003 | `dd1f2d44e2bce34c0456ac99c2f30f1d92636189db0ec20d10da89b39493ff40` | `2d 2d 20 53 68 61 72 65 64 20 69 6e 74 65 67 72 61 74 69 6f 6e 20 66 6f 75 6e 64 61 74 69 6f 6e` | none | 0 | LF | Yes | Yes |
| `202607220003_market_profile_foundation/migration.sql` | 3267 | `f33b590d39435a239f8783bef2c35015b6db32caf4f306107b393b2404e7d694` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 4f 72 67 61 6e 69 7a 61 74 69 6f 6e 22 0a 41 44 44 20 43` | none | 0 | LF | Yes | Yes |
| `202607220004_integration_runtime_hardening/migration.sql` | 3860 | `b8d1185845f7c793b636a7b9ec2ed97335a48c780fa1f297e0260ef325447da4` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 54 65 6e 61 6e 74 49 6e 74 65 67 72 61 74 69 6f 6e 22 0a` | none | 0 | LF | Yes | Yes |
| `202607230001_vapi_call_tracking/migration.sql` | 4944 | `2402f180e8765a5ff0d5b77b9c2602ce4d6f91bca784ec1449c34b4cb58e60f8` | `41 4c 54 45 52 20 54 41 42 4c 45 20 22 56 6f 69 63 65 4c 65 61 64 22 0a 41 44 44 20 43 4f 4c 55` | none | 0 | LF | Yes | Yes |
| `202607240001_voice_privacy_controls/migration.sql` | 1062 | `412440fab7aa87c09d50e62b4d252cc3f0e425ca1b1c0a8889839f174895eeb2` | `2d 2d 20 54 65 6e 61 6e 74 2d 73 63 6f 70 65 64 20 72 65 63 6f 72 64 69 6e 67 2c 20 74 72 61 6e` | none | 0 | LF | Yes | Yes |

`readableSql` is a defensive encoding/readability heuristic, not a PostgreSQL
parser. Prisma validation, static SQL audit and production migration status are
separate gates.
