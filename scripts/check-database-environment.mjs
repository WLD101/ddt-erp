import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const mode = process.env.DB_ENV_CHECK_MODE || "local";
const trackedExamples = [
  ".env.example",
  ".env.local.example",
  ".env.production.example",
];
const runtimeCandidates = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];
const urlKeys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "SHADOW_DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_DB_URL",
];
const staleHostPatterns = [
  /(^|\.)supabase\.(com|co)$/i,
  /pooler\.supabase\.com$/i,
];
const findings = [];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function classifyHost(hostname) {
  if (!hostname) return "missing";
  if (hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1") {
    return "loopback";
  }
  if (!hostname.includes(".") && !hostname.includes(":")) {
    return "docker-service";
  }
  return "network-address";
}

function isStaleSupabaseHost(hostname) {
  return staleHostPatterns.some((pattern) => pattern.test(hostname));
}

function summarizeUrl(value) {
  try {
    const url = new URL(value);
    return {
      ok: true,
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname || "<missing>",
      port: url.port || "<default>",
      database: url.pathname.replace(/^\//, "") || "<missing>",
      hostKind: classifyHost(url.hostname),
      staleSupabaseHost: isStaleSupabaseHost(url.hostname),
    };
  } catch {
    return {
      ok: false,
      protocol: "<unknown>",
      host: "<malformed>",
      port: "<unknown>",
      database: "<unknown>",
      hostKind: "malformed",
      staleSupabaseHost: false,
    };
  }
}

function inspectSource(sourceName, values, tracked) {
  for (const key of urlKeys) {
    const value = values[key];
    if (!value) continue;
    const summary = summarizeUrl(value);
    const finding = {
      source: sourceName,
      tracked,
      key,
      ...summary,
    };
    findings.push(finding);
  }
}

inspectSource("process.env", process.env, false);

for (const file of runtimeCandidates) {
  inspectSource(file, parseEnvFile(path.join(cwd, file)), false);
}

for (const file of trackedExamples) {
  inspectSource(file, parseEnvFile(path.join(cwd, file)), true);
}

const failures = [];
const warnings = [];

for (const finding of findings) {
  if (!finding.ok) {
    warnings.push(`${finding.source} ${finding.key} is malformed.`);
    continue;
  }

  if (finding.staleSupabaseHost) {
    const message = `${finding.source} ${finding.key} points to forbidden stale Supabase host ${finding.host}:${finding.port}.`;
    if (mode === "production" || finding.source === "process.env" || runtimeCandidates.includes(finding.source)) {
      failures.push(message);
    } else {
      warnings.push(message);
    }
  }
}

const payload = {
  checkedAt: new Date().toISOString(),
  mode,
  findings: findings.map((finding) => ({
    source: finding.source,
    tracked: finding.tracked,
    key: finding.key,
    protocol: finding.protocol,
    host: finding.host,
    port: finding.port,
    database: finding.database,
    hostKind: finding.hostKind,
    staleSupabaseHost: finding.staleSupabaseHost,
  })),
  warnings,
  failures,
};

console.log(JSON.stringify(payload, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
