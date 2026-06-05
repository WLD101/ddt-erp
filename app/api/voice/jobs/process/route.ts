import { NextResponse } from "next/server";
import { processVoiceJobs } from "@/modules/voice/jobs/service";

export async function POST(request: Request) {
  try {
    const result = await processVoiceJobs(20);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Voice Jobs API] Error processing jobs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Allow simple GET requests for cron-services like cron-job.org
  try {
    const result = await processVoiceJobs(20);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Voice Jobs API] Error processing jobs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
