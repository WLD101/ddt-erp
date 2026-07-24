import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const migrationRoot = path.resolve("prisma", "migrations");
const migrationFiles = fs
  .readdirSync(migrationRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    name: entry.name,
    file: path.join(migrationRoot, entry.name, "migration.sql"),
  }))
  .filter((entry) => fs.existsSync(entry.file))
  .sort((left, right) => left.name.localeCompare(right.name));

const destructivePatterns = [
  ["drop_table_or_column", /\bDROP\s+(?:TABLE|COLUMN)\b/gi],
  ["truncate", /\bTRUNCATE\s+(?:TABLE\s+)?/gi],
  ["delete", /\bDELETE\s+FROM\b/gi],
  ["enum_replacement", /\b(?:ALTER|DROP)\s+TYPE\b/gi],
];
const indexOwners = new Map();
const constraintOwners = new Map();
const reports = [];
const blockers = [];

function matches(sql, pattern) {
  return [...sql.matchAll(pattern)].length;
}

for (const migration of migrationFiles) {
  const sql = fs.readFileSync(migration.file, "utf8");
  const destructive = destructivePatterns
    .map(([key, pattern]) => ({ key, count: matches(sql, pattern) }))
    .filter((item) => item.count > 0);
  const nonNullWithoutDefault = matches(
    sql,
    /\bADD\s+COLUMN\s+"[^"]+"\s+[^,;]+\bNOT\s+NULL\b(?![^,;]*\bDEFAULT\b)/gi,
  );
  const dataRewrites = matches(
    sql,
    /^\s*UPDATE\s+"?[\w]+"?\b/gim,
  );
  const uniqueIndexes = [
    ...sql.matchAll(/\bCREATE\s+UNIQUE\s+INDEX\s+"([^"]+)"/gi),
  ].map((match) => match[1]);
  const indexes = [
    ...sql.matchAll(/\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+"([^"]+)"/gi),
  ].map((match) => match[1]);
  const constraints = [
    ...sql.matchAll(/\bCONSTRAINT\s+"([^"]+)"/gi),
  ].map((match) => match[1]);

  for (const indexName of indexes) {
    const previous = indexOwners.get(indexName);
    if (previous) {
      blockers.push({
        type: "duplicate_index_name",
        name: indexName,
        migrations: [previous, migration.name],
      });
    } else {
      indexOwners.set(indexName, migration.name);
    }
  }
  for (const constraintName of constraints) {
    const previous = constraintOwners.get(constraintName);
    if (previous) {
      blockers.push({
        type: "duplicate_constraint_name",
        name: constraintName,
        migrations: [previous, migration.name],
      });
    } else {
      constraintOwners.set(constraintName, migration.name);
    }
  }
  if (destructive.length > 0 || nonNullWithoutDefault > 0) {
    blockers.push({
      type: "unsafe_sql_pattern",
      migration: migration.name,
      destructive,
      nonNullWithoutDefault,
    });
  }

  reports.push({
    migration: migration.name,
    destructive,
    nonNullWithoutDefault,
    dataRewrites,
    uniqueIndexes: uniqueIndexes.length,
    foreignKeys: matches(sql, /\bFOREIGN\s+KEY\b/gi),
    manualReviewRequired: dataRewrites > 0 || uniqueIndexes.length > 0,
  });
}

const report = {
  migrationCount: reports.length,
  blockers,
  migrations: reports,
};
console.log(JSON.stringify(report, null, 2));
if (blockers.length > 0) process.exitCode = 1;
