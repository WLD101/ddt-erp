# WhatsQuery Dependency Security Resolution

Evidence date: 2026-07-24

## Result

```text
Critical: 0
High: 0
Moderate: 0
Low: 0
Accepted risks: 0
```

Both `npm audit --omit=dev --json` and `npm audit --json` complete with no
findings.

## Resolutions

| Dependency path | Before | Resolution | Final |
| --- | --- | --- | --- |
| `next -> postcss` | High | Next-scoped override | `postcss@8.5.22` |
| `next -> sharp` | High | Next-scoped override | `sharp@0.35.3` |
| `exceljs -> uuid` | Moderate | ExcelJS-scoped override | `uuid@11.1.1` |
| `tsx -> esbuild` | Moderate | Updated `tsx` | `tsx@4.23.1` |
| `shadcn -> MCP -> Hono` | Moderate | Retained required stylesheet package and overrode the vulnerable dev transport | `shadcn@4.14.1`, `@hono/node-server@2.0.11` |

`shadcn/tailwind.css` remains installed because the existing global stylesheet
imports it. Removing the package breaks the build and could alter the design;
the patched transitive override preserves the existing CSS.

## Verification

```bash
npm ci --ignore-scripts
npm audit --omit=dev --json
npm audit --json
npm run build
```

The lockfile is part of the release artifact. Repeat both audits on the VPS or
CI runner after `npm ci` and before service restart.

