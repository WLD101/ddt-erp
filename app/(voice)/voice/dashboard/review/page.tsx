import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { VoiceReviewInbox } from "@/components/voice/voice-review-inbox";
import { getVoiceReviewItemDetails, listVoiceReviewInbox } from "@/modules/voice/review/service";

export default async function VoiceReviewInboxPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const [reviewItems, products] = await Promise.all([
    listVoiceReviewInbox(ctx.organizationId),
    prisma.product.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unitPrice: true },
    }),
  ]);

  const details = await Promise.all(
    reviewItems.map(async (reviewItem) => {
      const detail = await getVoiceReviewItemDetails(ctx.organizationId, reviewItem.id);
      return {
        reviewItem: {
          id: detail.reviewItem.id,
          sourceType: detail.reviewItem.sourceType,
          sourceId: detail.reviewItem.sourceId,
          status: detail.reviewItem.status,
          version: detail.reviewItem.version,
          marketKey: detail.reviewItem.marketKey,
          currency: detail.reviewItem.currency,
          timezone: detail.reviewItem.timezone,
          providerCallId: detail.reviewItem.providerCallId,
          createdAt: detail.reviewItem.createdAt.toISOString(),
          updatedAt: detail.reviewItem.updatedAt.toISOString(),
        },
        customerSnapshot: detail.customerSnapshot,
        confirmedFields: detail.confirmedFields,
        inferredFields: detail.inferredFields,
        proposedAction: detail.proposedAction,
        unresolvedFields: detail.unresolvedFields,
        validationErrors: detail.validationErrors,
        sourceRecord: detail.sourceRecord,
        outcomeLinks: detail.outcomeLinks.map((outcome) => ({
          id: outcome.id,
          outcomeType: outcome.outcomeType,
          outcomeId: outcome.outcomeId,
          customerId: outcome.customerId,
          idempotencyKey: outcome.idempotencyKey,
          createdAt: outcome.createdAt.toISOString(),
        })),
        transitions: detail.transitions.map((transition) => ({
          id: transition.id,
          previousStatus: transition.previousStatus,
          newStatus: transition.newStatus,
          reason: transition.reason,
          actorRole: transition.actorRole,
          createdAt: transition.createdAt.toISOString(),
        })),
        callLog: detail.callLog
          ? {
              id: detail.callLog.id,
              startedAt: detail.callLog.startedAt?.toISOString() ?? null,
              summary: detail.callLog.summary,
              transcript: detail.callLog.transcript,
              transcriptPlaceholder: detail.callLog.transcriptPlaceholder,
              recordingUrl: detail.callLog.recordingUrl,
            }
          : null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Staff review</div>
            <h1 className="mt-3 text-3xl font-black text-on-surface">Voice review inbox</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Every Vapi request stays approval-first. Staff can approve customer creation, draft sales conversion, and bookings without exposing tenant, market, tax, or backend pricing controls to the browser.
            </p>
          </div>
          <div className="rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-black text-on-surface-variant">
            {details.length} waiting
          </div>
        </div>
      </section>

      <VoiceReviewInbox items={details} products={products} />
    </div>
  );
}
