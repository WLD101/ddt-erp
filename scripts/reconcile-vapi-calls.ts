import { writeFile } from "node:fs/promises";
import path from "node:path";
import { reconcileVapiCalls } from "../modules/voice/vapi/reconciliation";

function readArg(name: string) {
  const inline = process.argv.find((value) => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function parseDateArg(name: string, fallback: Date) {
  const value = readArg(name);
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${name} must be an ISO date or timestamp.`);
  return parsed;
}

function parsePositiveInteger(name: string, fallback: number) {
  const value = readArg(name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

async function main() {
  const to = parseDateArg("--to", new Date());
  const from = parseDateArg("--from", new Date(to.getTime() - 6 * 60 * 60_000));
  const apply = hasFlag("--apply");
  const report = await reconcileVapiCalls({
    from,
    to,
    tenantId: readArg("--tenant"),
    apply,
    repair: hasFlag("--repair"),
    onlyMissing: hasFlag("--only-missing"),
    pageSize: parsePositiveInteger("--page-size", 500),
    maxPages: parsePositiveInteger("--max-pages", 20),
  });

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const reportPath = readArg("--report");
  if (reportPath) {
    const absolutePath = path.resolve(reportPath);
    await writeFile(absolutePath, serialized, { encoding: "utf8", flag: "wx" }).catch(
      async (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
        throw new Error(`Report file already exists: ${absolutePath}`);
      },
    );
    console.log(JSON.stringify({ reportWritten: absolutePath, mode: report.mode }));
  } else {
    console.log(serialized);
  }

  if (!apply) {
    console.error("Dry run only. Re-run with --apply and optionally --repair after reviewing the report.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Vapi reconciliation failed.");
  process.exitCode = 1;
});
