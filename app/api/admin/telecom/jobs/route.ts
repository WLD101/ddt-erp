import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { telecomJobAdminActionSchema } from "@/modules/calls/schema";
import { cancelTelecomJob, listTelecomJobBacklog, retryTelecomJob } from "@/modules/calls/telecom-worker";

function forbidden() {
  return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Platform admin access required." } }, { status: 403 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") || 50), 1), 100);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const deadLettersOnly = searchParams.get("deadLettersOnly") === "true";

  const [backlog, jobs] = await Promise.all([
    listTelecomJobBacklog(),
    prisma.voiceJob.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(deadLettersOnly ? { deadLetteredAt: { not: null } } : {}),
        type: type || { startsWith: "TELECOM_" },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take,
      select: {
        id: true,
        type: true,
        status: true,
        organizationId: true,
        correlationId: true,
        entityType: true,
        entityId: true,
        attempts: true,
        maxAttempts: true,
        workerVersion: true,
        failureCode: true,
        lastError: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        lockedAt: true,
        lockedBy: true,
        leaseExpiresAt: true,
        timeoutAt: true,
        cancelRequestedAt: true,
        cancelledAt: true,
        cancelReason: true,
        deadLetteredAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: { backlog, jobs } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isPlatformAdminEmail(session?.user?.email)) {
    return forbidden();
  }

  try {
    const input = telecomJobAdminActionSchema.parse(await request.json());
    const job = input.action === "retry"
      ? await retryTelecomJob(input.jobId)
      : await cancelTelecomJob(input.jobId, input.reason || "Cancelled by platform operator.");

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: job.id,
          type: job.type,
          status: job.status,
          attempts: job.attempts,
          failureCode: job.failureCode,
          cancelReason: job.cancelReason,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TELECOM_JOB_ADMIN_FAILED",
          message: error instanceof Error ? error.message : "Unable to update telecom job.",
        },
      },
      { status: 400 }
    );
  }
}
