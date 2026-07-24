import { NextResponse } from "next/server";
import { processTelecomJobs, scheduleRecurringTelecomJobs } from "@/modules/calls/telecom-worker";
import { processVoiceJobs, scheduleRecurringVoiceJobs } from "@/modules/voice/jobs/service";

function isAuthorizedJobRequest(request: Request) {
  const configuredSecret = process.env.VOICE_JOBS_SECRET;
  if (!configuredSecret) return false;

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
  const headerToken = request.headers.get("x-voice-jobs-secret");

  return bearerToken === configuredSecret || headerToken === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([scheduleRecurringTelecomJobs(), scheduleRecurringVoiceJobs()]);
    const [voice, telecom] = await Promise.all([processVoiceJobs(20), processTelecomJobs(20)]);
    const result = { voice, telecom };
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Voice Jobs API] Error processing jobs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([scheduleRecurringTelecomJobs(), scheduleRecurringVoiceJobs()]);
    const [voice, telecom] = await Promise.all([processVoiceJobs(20), processTelecomJobs(20)]);
    const result = { voice, telecom };
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Voice Jobs API] Error processing jobs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
