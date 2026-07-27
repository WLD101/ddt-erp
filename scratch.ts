import { checkRateLimit, rateLimitKey } from "./lib/security/rate-limit";

async function main() {
  const key = rateLimitKey("otp", `fallback-${Date.now()}@example.com`);

  console.log("first call");
  const first = await checkRateLimit(key, { limit: 1, windowMs: 10_000 });
  console.log("first result:", first);

  console.log("second call");
  const second = await checkRateLimit(key, { limit: 1, windowMs: 10_000 });
  console.log("second result:", second);
}

main().catch(console.error);
