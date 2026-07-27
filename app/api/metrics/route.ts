import { NextResponse } from "next/server";
import { registry } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await registry.metrics();
    return new NextResponse(metrics, {
      headers: {
        "Content-Type": registry.contentType,
      },
    });
  } catch (error) {
    console.error("Failed to collect Prometheus metrics:", error);
    return new NextResponse("Failed to collect metrics", { status: 500 });
  }
}
