import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  isAllowedExternalHostname,
  parseSafeExternalUrl,
} from "@/lib/security/outbound-url";
import { getCurrentTenantContext, requireRole, TenantForbiddenError } from "@/lib/tenant";
import { resolveVoicePrivacyPolicy } from "@/modules/voice/privacy/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getCurrentTenantContext();
    const policy = await resolveVoicePrivacyPolicy(ctx.organizationId);
    if (policy.isClinical) {
      requireRole(ctx, "owner");
    } else {
      requireRole(ctx, "owner", "admin");
    }

    if (!policy.recordingEnabled || !policy.allowRecordingPlayback) {
      return NextResponse.json(
        { error: "Recording playback is disabled for this tenant." },
        { status: 403 },
      );
    }

    const callLog = await prisma.voiceCallLog.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      select: {
        recordingUrl: true,
        recordingDisclosureStatus: true,
      },
    });

    if (!callLog?.recordingUrl) {
      return NextResponse.json({ error: "Recording not available." }, { status: 404 });
    }
    if (
      policy.recordingDisclosureEnabled &&
      callLog.recordingDisclosureStatus !== "completed"
    ) {
      return NextResponse.json(
        { error: "Recording disclosure was not completed." },
        { status: 403 },
      );
    }

    let recordingUrl: URL;
    try {
      recordingUrl = parseSafeExternalUrl(callLog.recordingUrl, {
        label: "recording URL",
      });
    } catch {
      return NextResponse.json({ error: "Invalid recording URL." }, { status: 422 });
    }

    const allowedHosts = (process.env.VOICE_RECORDING_ALLOWED_HOSTS || "")
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean);
    if (
      process.env.NODE_ENV === "production" &&
      !isAllowedExternalHostname(recordingUrl.hostname, allowedHosts)
    ) {
      return NextResponse.json(
        { error: "Recording provider is not allowed." },
        { status: 503 },
      );
    }

    const response = NextResponse.redirect(recordingUrl, 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("[Voice Recording] Failed to resolve recording", error);
    return NextResponse.json({ error: "Recording lookup failed." }, { status: 500 });
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
        recordingUrl: null,
        recordingDeletedAt: new Date(),
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Recording not found." },
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
    console.error("[Voice Recording] Failed to delete recording", error);
    return NextResponse.json(
      { error: "Recording deletion failed." },
      { status: 500 },
    );
  }
}
