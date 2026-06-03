import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceRequestQueue } from "@/components/voice/voice-request-queue";
import { getVoiceRequestQueues } from "@/modules/voice/service";

export default async function VoiceReservationsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const queues = await getVoiceRequestQueues(ctx.organizationId);

  return (
    <VoiceRequestQueue
      title="Reservation Requests"
      description="These are table booking requests captured from the AI receptionist. They are saved for human confirmation and are never treated as confirmed bookings automatically."
      badgeLabel="Bookings"
      emptyMessage="No reservation requests have been captured yet."
      rows={queues.reservations.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      }))}
    />
  );
}
