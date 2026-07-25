#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const UTF16LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16BE_BOM = Buffer.from([0xfe, 0xff]);
const SQL_KEYWORD =
  /\b(ALTER|BEGIN|COMMENT|COMMIT|CREATE|DELETE|DO|DROP|GRANT|INSERT|REVOKE|TRUNCATE|UPDATE)\b/i;

function startsWith(buffer, prefix) {
  return buffer.length >= prefix.length && buffer.subarray(0, prefix.length).equals(prefix);
}

function detectLikelyUtf16(buffer) {
  if (buffer.length < 4) {
    return { likelyUtf16LE: false, likelyUtf16BE: false };
  }

  let evenNulls = 0;
  let oddNulls = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index % 2 === 0) evenNulls += 1;
    else oddNulls += 1;
  }

  const pairs = Math.max(1, Math.floor(buffer.length / 2));
  return {
    likelyUtf16LE: oddNulls / pairs > 0.35 && evenNulls / pairs < 0.08,
    likelyUtf16BE: evenNulls / pairs > 0.35 && oddNulls / pairs < 0.08,
  };
}

function detectLineEndings(text) {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const bareCrCount = (text.match(/\r(?!\n)/g) || []).length;
  const lfCount = (text.match(/(?<!\r)\n/g) || []).length;

  let type = "none";
  const kinds = [crlfCount > 0, bareCrCount > 0, lfCount > 0].filter(Boolean).length;
  if (kinds > 1) type = "mixed";
  else if (crlfCount > 0) type = "CRLF";
  else if (bareCrCount > 0) type = "CR";
  else if (lfCount > 0) type = "LF";

  return { type, crlfCount, bareCrCount, lfCount };
}

export function inspectMigrationBuffer(buffer, filePath = "migration.sql") {
  const bytes = Buffer.from(buffer);
  const issues = [];
  const nullByteCount = bytes.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  const utf8Bom = startsWith(bytes, UTF8_BOM);
  const utf16leBom = startsWith(bytes, UTF16LE_BOM);
  const utf16beBom = startsWith(bytes, UTF16BE_BOM);
  const { likelyUtf16LE, likelyUtf16BE } = detectLikelyUtf16(bytes);

  let bom = "none";
  if (utf8Bom) bom = "UTF-8";
  else if (utf16leBom) bom = "UTF-16LE";
  else if (utf16beBom) bom = "UTF-16BE";

  if (bytes.length === 0) issues.push("file is empty");
  if (utf8Bom) issues.push("UTF-8 BOM is not permitted");
  if (utf16leBom || utf16beBom) issues.push("UTF-16 BOM is not permitted");
  if (nullByteCount > 0) issues.push(`contains ${nullByteCount} null byte(s)`);
  if (!utf16leBom && !utf16beBom && (likelyUtf16LE || likelyUtf16BE)) {
    issues.push("likely BOM-less UTF-16");
  }

  let text = "";
  let validUtf8 = true;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    validUtf8 = false;
    issues.push("cannot be decoded as valid UTF-8");
  }

  const lineEndings = detectLineEndings(text);
  if (lineEndings.crlfCount > 0 || lineEndings.bareCrCount > 0) {
    issues.push(`line endings must be LF only (detected ${lineEndings.type})`);
  }
  if (validUtf8 && text.trim().length === 0 && bytes.length > 0) {
    issues.push("file contains only whitespace");
  }

  const hasUnexpectedControls = [...text].some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 && character !== "\n" && character !== "\t";
  });
  if (hasUnexpectedControls) {
    issues.push("contains unexpected control characters");
  }

  const readableSql =
    validUtf8 &&
    text.trim().length > 0 &&
    !hasUnexpectedControls &&
    SQL_KEYWORD.test(text) &&
    text.includes(";");
  if (
    validUtf8 &&
    text.trim().length > 0 &&
    !hasUnexpectedControls &&
    !readableSql
  ) {
    issues.push("does not look like readable SQL");
  }

  return {
    filePath,
    byteSize: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    first32Hex: bytes.subarray(0, 32).toString("hex").match(/../g)?.join(" ") || "",
    bom,
    nullByteCount,
    likelyUtf16LE,
    likelyUtf16BE,
    validUtf8,
    lineEndingType: lineEndings.type,
    crlfCount: lineEndings.crlfCount,
    bareCrCount: lineEndings.bareCrCount,
    lfCount: lineEndings.lfCount,
    readableSql,
    issues,
  };
}

export function inspectMigrationDirectory(migrationsRoot) {
  const root = resolve(migrationsRoot);
  const entries = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  return entries.map((entry) => {
    const filePath = join(root, entry.name, "migration.sql");
    if (!existsSync(filePath)) {
      return {
        filePath,
        migration: entry.name,
        missing: true,
        byteSize: null,
        sha256: null,
        first32Hex: "",
        bom: "missing",
        nullByteCount: null,
        likelyUtf16LE: false,
        likelyUtf16BE: false,
        validUtf8: false,
        lineEndingType: "missing",
        readableSql: false,
        issues: ["migration.sql is missing"],
      };
    }

    return {
      migration: entry.name,
      missing: false,
      ...inspectMigrationBuffer(readFileSync(filePath), filePath),
    };
  });
}

function runCli() {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const defaultRoot = resolve(scriptDirectory, "..", "prisma", "migrations");
  const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
  const root = rootArgument ? resolve(rootArgument) : defaultRoot;
  const reports = inspectMigrationDirectory(root);
  const failures = reports.filter((report) => report.issues.length > 0);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ root, migrationCount: reports.length, failures, migrations: reports }, null, 2));
  } else {
    for (const failure of failures) {
      console.error(`${failure.migration}: ${failure.issues.join("; ")}`);
    }
    console.log(
      failures.length === 0
        ? `Prisma migration encoding check passed: ${reports.length} migration file(s).`
        : `Prisma migration encoding check failed: ${failures.length} of ${reports.length} migration(s).`,
    );
  }

  if (failures.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) runCli();
