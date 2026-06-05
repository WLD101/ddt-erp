import { prisma } from "@/lib/prisma";

export async function getVoiceUsageMeter(organizationId: string) {
  const meter = await prisma.voiceUsageMeter.findUnique({
    where: { organizationId },
  });

  if (!meter) {
    return prisma.voiceUsageMeter.create({
      data: {
        organizationId,
      },
    });
  }

  // Check if we need to reset monthly stats
  const now = new Date();
  if (meter.resetPeriod.getMonth() !== now.getMonth() || meter.resetPeriod.getFullYear() !== now.getFullYear()) {
    return prisma.voiceUsageMeter.update({
      where: { id: meter.id },
      data: {
        callsThisMonth: 0,
        callMinutesThisMonth: 0,
        leadsThisMonth: 0,
        bookingRequestsThisMonth: 0,
        orderRequestsThisMonth: 0,
        whatsappNotificationsThisMonth: 0,
        resetPeriod: now,
      },
    });
  }

  // Reset daily stats if it's a new day
  if (meter.updatedAt.getDate() !== now.getDate() || meter.updatedAt.getMonth() !== now.getMonth()) {
     return prisma.voiceUsageMeter.update({
      where: { id: meter.id },
      data: {
        callsToday: 0,
        callMinutesToday: 0,
        webhookEventsToday: 0,
        failedWebhookEventsToday: 0,
      },
    });
  }

  return meter;
}

export async function incrementUsageStat(organizationId: string, stat: "calls" | "leads" | "bookings" | "orders" | "whatsapp" | "webhook_success" | "webhook_failed", countOrMinutes: number = 1) {
  await getVoiceUsageMeter(organizationId); // Ensure it exists and is reset if needed

  let dataUpdate: any = {};

  switch(stat) {
    case "calls":
      dataUpdate = {
        callsToday: { increment: 1 },
        callsThisMonth: { increment: 1 },
        callMinutesToday: { increment: countOrMinutes },
        callMinutesThisMonth: { increment: countOrMinutes },
      };
      break;
    case "leads":
      dataUpdate = { leadsThisMonth: { increment: 1 } };
      break;
    case "bookings":
      dataUpdate = { bookingRequestsThisMonth: { increment: 1 } };
      break;
    case "orders":
      dataUpdate = { orderRequestsThisMonth: { increment: 1 } };
      break;
    case "whatsapp":
      dataUpdate = { whatsappNotificationsThisMonth: { increment: 1 } };
      break;
    case "webhook_success":
      dataUpdate = { webhookEventsToday: { increment: 1 } };
      break;
    case "webhook_failed":
      dataUpdate = { failedWebhookEventsToday: { increment: 1 } };
      break;
  }

  return prisma.voiceUsageMeter.update({
    where: { organizationId },
    data: dataUpdate,
  });
}

export async function checkUsageLimits(organizationId: string) {
  const meter = await getVoiceUsageMeter(organizationId);
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: { include: { Package: true } } },
  });

  let voiceLimit = 50; // Hardcoded fallback limit for beta
  if (org?.subscription?.Package?.featureJson) {
    try {
      const feats = JSON.parse(org.subscription.Package.featureJson);
      if (feats?.maxVoiceCallsPerMonth) {
        voiceLimit = Number(feats.maxVoiceCallsPerMonth);
      }
    } catch(e) {}
  }

  const warnings = [];
  let isBlocked = false;

  if (meter.callsThisMonth >= voiceLimit * 0.9 && meter.callsThisMonth < voiceLimit) {
    warnings.push("APPROACHING_CALL_LIMIT");
  }

  if (meter.callsThisMonth >= voiceLimit) {
    warnings.push("EXCEEDED_CALL_LIMIT");
    isBlocked = true;
  }

  return {
    meter,
    warnings,
    isBlocked,
    limit: voiceLimit,
  };
}

export async function checkAndAcquireActiveCallSlot(organizationId: string) {
  const meter = await getVoiceUsageMeter(organizationId);

  if (meter.activeCalls >= meter.maxActiveCalls) {
    return { acquired: false, reason: "CAPACITY_FULL" };
  }

  const usage = await checkUsageLimits(organizationId);
  if (usage.isBlocked) {
    return { acquired: false, reason: "MONTHLY_LIMIT_EXCEEDED" };
  }

  await prisma.voiceUsageMeter.update({
    where: { id: meter.id },
    data: { activeCalls: { increment: 1 } }
  });

  return { acquired: true };
}

export async function releaseActiveCallSlot(organizationId: string) {
  const meter = await getVoiceUsageMeter(organizationId);
  if (meter.activeCalls > 0) {
    await prisma.voiceUsageMeter.update({
      where: { id: meter.id },
      data: { activeCalls: { decrement: 1 } }
    });
  }
}
