import assert from "node:assert/strict";
import test from "node:test";

import { escapeCsvCell } from "../../lib/security/csv";
import { validateImportPayload } from "../../modules/imports/service";

test("CSV exports neutralize spreadsheet formulas", () => {
  assert.equal(escapeCsvCell("=HYPERLINK(\"https://evil.test\")"), "\"'=HYPERLINK(\"\"https://evil.test\"\")\"");
  assert.equal(escapeCsvCell("+SUM(1,2)"), "\"'+SUM(1,2)\"");
  assert.equal(escapeCsvCell("ordinary text"), "\"ordinary text\"");
});

test("import payload validation rejects oversized or malformed rows", () => {
  assert.throws(() =>
    validateImportPayload({
      importType: "CUSTOMERS",
      fileName: "customers.csv",
      mapping: { customerName: "Name" },
      rows: Array.from({ length: 5_001 }, () => ({ Name: "Example" })),
    }),
  );

  assert.throws(() =>
    validateImportPayload({
      importType: "CUSTOMERS",
      fileName: "../../customers.exe",
      mapping: { customerName: "Name" },
      rows: [{ Name: "Example" }],
    }),
  );
});

