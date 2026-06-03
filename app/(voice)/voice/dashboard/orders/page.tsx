import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceRequestQueue } from "@/components/voice/voice-request-queue";
import { getVoiceRequestQueues } from "@/modules/voice/service";

export default async function VoiceOrdersPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const queues = await getVoiceRequestQueues(ctx.organizationId);

  return (
    <VoiceRequestQueue
      title="Order Requests"
      description="These are takeaway and order requests captured from calls. They are saved for staff review only and never create ERP sales, invoices, or payment records."
      badgeLabel="Orders"
      emptyMessage="No order requests have been captured yet."
      rows={queues.orders.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      }))}
    />
  );
}
