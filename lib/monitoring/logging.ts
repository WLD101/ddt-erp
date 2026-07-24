import fs from "fs/promises";
import path from "path";
import { redactForLogging } from "@/lib/security/redaction";

export async function ensureLogDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function appendJsonLine(filePath: string, payload: Record<string, unknown>) {
  await ensureLogDirectory(filePath);
  await fs.appendFile(filePath, `${JSON.stringify(redactForLogging(payload))}\n`, "utf8");
}

export async function readRecentJsonLines<T = Record<string, unknown>>(filePath: string, limit = 50): Promise<T[]> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    const lines = text
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit);

    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}
