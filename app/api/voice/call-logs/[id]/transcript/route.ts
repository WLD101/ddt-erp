import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getCurrentTenantContext,
  requireRole,
  TenantForbiddenError,
} from "@/lib/tenant";
import { resolveVoicePrivacyPolicy } from "@/modules/voice/privacy/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentTenantContext();
    const policy = await resolveVoicePrivacyPolicy(ctx.organizationId);
    if (policy.isClinical) {
      requireRole(ctx, "owner");
    } else {
      requireRole(ctx, "owner", "admin");
    }

    if (!policy.transcriptionEnabled || !policy.allowTranscriptAccess) {
      return NextResponse.json(
        { error: "Transcript access is disabled for this tenant." },
        { status: 403 },
      );
    }

    const callLog = await prisma.voiceCallLog.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      select: {
        transcript: true,
        transcriptStatus: true,
      },
    });
    if (!callLog?.transcript) {
      return NextResponse.json(
        { error: "Transcript not available." },
        { status: 404 },
      );
    }

    return NextResponse.json(callLog, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[Voice Transcript] Failed to resolve transcript", error);
    return NextResponse.json(
      { error: "Transcript lookup failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner");

    const deleted = await prisma.voiceCallLog.updateMany({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      data: {
        transcript: null,
        messagesJson: null,
        transcriptPlaceholder: null,
        transcriptStatus: "not_available",
        transcriptDeletedAt: new Date(),
      },
    });
    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Transcript not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[Voice Transcript] Failed to delete transcript", error);
    return NextResponse.json(
      { error: "Transcript deletion failed." },
      { status: 500 },
    );
  }
}
