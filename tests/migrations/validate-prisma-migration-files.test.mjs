import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  inspectMigrationBuffer,
  inspectMigrationDirectory,
} from "../../scripts/validate-prisma-migration-files.mjs";

const VALID_SQL = 'ALTER TABLE "Example" ADD COLUMN "value" TEXT;\n';

test("accepts UTF-8 SQL with LF line endings", () => {
  const report = inspectMigrationBuffer(Buffer.from(VALID_SQL, "utf8"));
  assert.deepEqual(report.issues, []);
  assert.equal(report.validUtf8, true);
  assert.equal(report.readableSql, true);
  assert.equal(report.lineEndingType, "LF");
});

test("rejects a UTF-8 BOM", () => {
  const buffer = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(VALID_SQL)]);
  assert.match(inspectMigrationBuffer(buffer).issues.join(" "), /UTF-8 BOM/);
});

test("rejects UTF-16LE with a BOM", () => {
  const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(VALID_SQL, "utf16le")]);
  assert.match(inspectMigrationBuffer(buffer).issues.join(" "), /UTF-16 BOM/);
});

test("rejects BOM-less UTF-16LE", () => {
  const report = inspectMigrationBuffer(Buffer.from(VALID_SQL, "utf16le"));
  assert.equal(report.likelyUtf16LE, true);
  assert.match(report.issues.join(" "), /BOM-less UTF-16/);
});

test("rejects embedded null bytes", () => {
  const report = inspectMigrationBuffer(Buffer.from('ALTER\u0000 TABLE "Example";\n', "utf8"));
  assert.match(report.issues.join(" "), /null byte/);
});

test("rejects unexpected control characters", () => {
  const report = inspectMigrationBuffer(Buffer.from('ALTER TABLE "Example";\u0007\n', "utf8"));
  assert.match(report.issues.join(" "), /unexpected control/);
});

test("rejects UTF-8 text that is not recognizable SQL", () => {
  const report = inspectMigrationBuffer(Buffer.from("this is not a migration\n", "utf8"));
  assert.match(report.issues.join(" "), /readable SQL/);
});

test("rejects an empty migration file", () => {
  assert.match(inspectMigrationBuffer(Buffer.alloc(0)).issues.join(" "), /empty/);
});

test("rejects CRLF line endings", () => {
  const report = inspectMigrationBuffer(Buffer.from(VALID_SQL.replace(/\n/g, "\r\n")));
  assert.match(report.issues.join(" "), /LF only/);
});

test("rejects a missing migration.sql file", () => {
  const root = mkdtempSync(join(tmpdir(), "whatsquery-migrations-"));
  try {
    mkdirSync(join(root, "202607240001_missing"));
    const reports = inspectMigrationDirectory(root);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].missing, true);
    assert.match(reports[0].issues.join(" "), /missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("accepts a complete migration directory", () => {
  const root = mkdtempSync(join(tmpdir(), "whatsquery-migrations-"));
  try {
    const migration = join(root, "202607240001_valid");
    mkdirSync(migration);
    writeFileSync(join(migration, "migration.sql"), VALID_SQL);
    assert.deepEqual(inspectMigrationDirectory(root)[0].issues, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
