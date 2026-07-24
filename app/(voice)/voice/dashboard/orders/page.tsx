import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceRequestQueue } from "@/components/voice/voice-request-queue";
import { getVoiceRequestQueues } from "@/modules/voice/service";
import { prisma } from "@/lib/prisma";

export default async function VoiceOrdersPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const queues = await getVoiceRequestQueues(ctx.organizationId);
  const providerCallIds = queues.orders
    .map((order) => order.providerCallId)
    .filter((id): id is string => Boolean(id));
  const callLogs = providerCallIds.length
    ? await prisma.voiceCallLog.findMany({
        where: {
          organizationId: ctx.organizationId,
          providerCallId: { in: providerCallIds },
        },
        select: { id: true, providerCallId: true, recordingUrl: true },
      })
    : [];
  const recordingByProviderCallId = new Map(
    callLogs
      .filter((log) => log.providerCallId)
      .map((log) => [log.providerCallId as string, log.recordingUrl ? `/api/voice/call-logs/${log.id}/recording` : null]),
  );

  return (
    <VoiceRequestQueue
      title="Order Requests"
      description="These are takeaway and order requests captured from calls. They are saved for staff review only and never create ERP sales, invoices, or payment records."
      badgeLabel="Orders"
      emptyMessage="No order requests have been captured yet."
      rows={queues.orders.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        receiptHref: lead.source === "VOICE_ORDER_REQUEST" ? `/voice/dashboard/orders/${lead.id}/receipt` : null,
        recordingHref: lead.providerCallId ? recordingByProviderCallId.get(lead.providerCallId) ?? null : null,
      }))}
    />
  );
}
