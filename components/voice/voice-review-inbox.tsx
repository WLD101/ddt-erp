"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { VoiceStatusPill, type VoiceStatusVariant } from "@/components/voice/ui/voice-status-pill";
import { approveVoiceBookingAction, approveVoiceLeadCustomerAction, approveVoiceOrderDraftAction, assignVoiceReviewCallbackAction, rejectVoiceReviewAction, requestVoiceReviewInformationAction, retryVoiceReviewAction } from "@/modules/voice/review/actions";

type ReviewInboxItem = {
  reviewItem: {
    id: string;
    sourceType: string;
    sourceId: string;
    status: string;
    version: number;
    marketKey: string;
    currency: string;
    timezone: string;
    providerCallId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customerSnapshot: Record<string, unknown> | null;
  confirmedFields: Record<string, unknown> | null;
  inferredFields: Record<string, unknown> | null;
  proposedAction: Record<string, unknown> | null;
  unresolvedFields: string[];
  validationErrors: string[];
  sourceRecord: Record<string, unknown> | null;
  outcomeLinks: Array<{
    id: string;
    outcomeType: string;
    outcomeId: string | null;
    customerId: string | null;
    idempotencyKey: string;
    createdAt: string;
  }>;
  transitions: Array<{
    id: string;
    previousStatus: string | null;
    newStatus: string;
    reason: string | null;
    actorRole: string | null;
    createdAt: string;
  }>;
  callLog: {
    id: string;
    startedAt: string | null;
    summary: string | null;
    transcript: string | null;
    transcriptPlaceholder: string | null;
    recordingUrl: string | null;
  } | null;
};

type ProductOption = {
  id: string;
  name: string;
  unitPrice: number;
};

function getStatusVariant(status: string): VoiceStatusVariant {
  switch (status) {
    case "completed":
      return "online";
    case "needs_information":
    case "needs_staff_review":
    case "captured":
      return "warning";
    case "failed":
    case "rejected":
    case "dead_lettered":
      return "error";
    default:
      return "default";
  }
}

function formatUnknownMap(value: Record<string, unknown> | null) {
  return Object.entries(value ?? {}).filter(([, entry]) => entry !== null && entry !== undefined && entry !== "");
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toDateTimeLocalValue(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function VoiceReviewInbox({
  items,
  products,
}: {
  items: ReviewInboxItem[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleResult(promise: Promise<{ success: boolean; error?: string }>) {
    const result = await promise;
    if (!result.success) {
      toast.error(result.error || "The review action could not be completed.");
      return;
    }
    toast.success("Review action completed.");
    router.refresh();
  }

  async function handleReasonAction(
    item: ReviewInboxItem,
    label: string,
    action: (payload: { reviewItemId: string; expectedVersion: number; reason: string }) => Promise<{ success: boolean; error?: string }>,
  ) {
    const reason = window.prompt(label);
    if (!reason) return;
    startTransition(() => {
      void handleResult(
        action({
          reviewItemId: item.reviewItem.id,
          expectedVersion: item.reviewItem.version,
          reason,
        }),
      );
    });
  }

  function handleApproveLead(event: React.FormEvent<HTMLFormElement>, item: ReviewInboxItem) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void handleResult(
        approveVoiceLeadCustomerAction({
          reviewItemId: item.reviewItem.id,
          expectedVersion: item.reviewItem.version,
          customerIdentity: {
            name: String(formData.get("name") || ""),
            phone: String(formData.get("phone") || ""),
            email: String(formData.get("email") || ""),
          },
        }),
      );
    });
  }

  function handleApproveBooking(event: React.FormEvent<HTMLFormElement>, item: ReviewInboxItem) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void handleResult(
        approveVoiceBookingAction({
          reviewItemId: item.reviewItem.id,
          expectedVersion: item.reviewItem.version,
          customerIdentity: {
            name: String(formData.get("name") || ""),
            phone: String(formData.get("phone") || ""),
            email: String(formData.get("email") || ""),
          },
          requestedStartAt: String(formData.get("requestedStartAt") || ""),
          bookingType: String(formData.get("bookingType") || ""),
          notes: String(formData.get("notes") || ""),
        }),
      );
    });
  }

  function handleApproveOrder(event: React.FormEvent<HTMLFormElement>, item: ReviewInboxItem) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lines = products
      .map((product) => {
        const raw = Number(formData.get(`qty:${product.id}`) || 0);
        return {
          productId: product.id,
          quantity: Number.isFinite(raw) ? raw : 0,
        };
      })
      .filter((line) => line.quantity > 0);

    startTransition(() => {
      void handleResult(
        approveVoiceOrderDraftAction({
          reviewItemId: item.reviewItem.id,
          expectedVersion: item.reviewItem.version,
          customerIdentity: {
            name: String(formData.get("name") || ""),
            phone: String(formData.get("phone") || ""),
            email: String(formData.get("email") || ""),
          },
          notes: String(formData.get("notes") || ""),
          lines,
        }),
      );
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-6 py-12 text-center text-sm text-on-surface-variant">
        No voice review items are waiting for staff action.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const snapshot = item.customerSnapshot ?? {};
        const confirmedFields = formatUnknownMap(item.confirmedFields);
        const inferredFields = formatUnknownMap(item.inferredFields);
        const proposedAction = formatUnknownMap(item.proposedAction);
        const sourceSummary =
          item.callLog?.summary ||
          item.callLog?.transcriptPlaceholder ||
          asText(item.sourceRecord?.reasonForCall) ||
          asText(item.sourceRecord?.orderDetailsText) ||
          asText(item.sourceRecord?.specialRequests) ||
          "No summary captured yet.";

        return (
          <section key={item.reviewItem.id} className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
                    {item.reviewItem.sourceType}
                  </div>
                  <VoiceStatusPill variant={getStatusVariant(item.reviewItem.status)} label={item.reviewItem.status} />
                </div>
                <h2 className="text-2xl font-black text-on-surface">
                  {asText(snapshot.name) || asText(item.sourceRecord?.customerName) || asText(item.sourceRecord?.name) || "Unknown caller"}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-on-surface-variant">{sourceSummary}</p>
              </div>
              <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
                <div>Market: <span className="font-black uppercase text-on-surface">{item.reviewItem.marketKey}</span></div>
                <div>Currency: <span className="font-black text-on-surface">{item.reviewItem.currency}</span></div>
                <div>Timezone: <span className="font-black text-on-surface">{item.reviewItem.timezone}</span></div>
                <div>Captured: <span className="font-black text-on-surface">{new Date(item.reviewItem.createdAt).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Caller and call context</div>
                  <div className="mt-3 grid gap-2 text-sm text-on-surface-variant md:grid-cols-2">
                    <div>Phone: <span className="font-semibold text-on-surface">{asText(snapshot.phone) || asText(item.sourceRecord?.customerPhone) || asText(item.sourceRecord?.phone) || "-"}</span></div>
                    <div>Email: <span className="font-semibold text-on-surface">{asText(snapshot.email) || asText(item.sourceRecord?.email) || "-"}</span></div>
                    <div>Call date: <span className="font-semibold text-on-surface">{item.callLog?.startedAt ? new Date(item.callLog.startedAt).toLocaleString() : new Date(item.reviewItem.createdAt).toLocaleString()}</span></div>
                    <div>Original transcript: <Link href="/dashboard/call-logs" className="font-black text-primary underline-offset-4 hover:underline">Open call logs</Link></div>
                  </div>
                  {item.callLog?.recordingUrl ? (
                    <div className="mt-3">
                      <a
                        href={`/api/voice/call-logs/${item.callLog.id}/recording`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary"
                      >
                        Play recording
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoList title="Confirmed fields" values={confirmedFields} emptyLabel="No confirmed fields captured." />
                  <InfoList title="Inferred fields" values={inferredFields} emptyLabel="No inferred fields captured." />
                  <StringList title="Unresolved fields" values={item.unresolvedFields} emptyLabel="No unresolved fields." />
                  <StringList title="Validation errors" values={item.validationErrors} emptyLabel="No validation errors." />
                </div>

                <InfoList title="Proposed action" values={proposedAction} emptyLabel="No proposed action snapshot was captured." />

                {item.outcomeLinks.length > 0 ? (
                  <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-500">Linked outcomes</div>
                    <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                      {item.outcomeLinks.map((outcome) => (
                        <div key={outcome.id}>
                          <span className="font-black text-on-surface">{outcome.outcomeType}</span>
                          {" "}
                          {outcome.outcomeId || outcome.customerId || "pending"}
                          {" "}
                          <span className="text-xs">({new Date(outcome.createdAt).toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Staff approval</div>
                  {item.reviewItem.sourceType === "VoiceLead" ? (
                    <form className="mt-4 space-y-3" onSubmit={(event) => handleApproveLead(event, item)}>
                      <LabeledInput label="Customer name" name="name" defaultValue={asText(snapshot.name) || asText(item.sourceRecord?.name)} />
                      <LabeledInput label="Phone" name="phone" defaultValue={asText(snapshot.phone) || asText(item.sourceRecord?.phone)} />
                      <LabeledInput label="Email" name="email" defaultValue={asText(snapshot.email) || asText(item.sourceRecord?.email)} />
                      <ActionButton disabled={isPending} label="Approve customer" />
                    </form>
                  ) : null}

                  {item.reviewItem.sourceType === "VoiceReservationRequest" ? (
                    <form className="mt-4 space-y-3" onSubmit={(event) => handleApproveBooking(event, item)}>
                      <LabeledInput label="Customer name" name="name" defaultValue={asText(snapshot.name) || asText(item.sourceRecord?.customerName)} />
                      <LabeledInput label="Phone" name="phone" defaultValue={asText(snapshot.phone) || asText(item.sourceRecord?.customerPhone)} />
                      <LabeledInput label="Email" name="email" defaultValue={asText(snapshot.email)} />
                      <LabeledInput
                        label="Requested start"
                        name="requestedStartAt"
                        type="datetime-local"
                        defaultValue={toDateTimeLocalValue(item.confirmedFields?.requestedTime || item.sourceRecord?.requestedTime)}
                      />
                      <LabeledInput label="Booking type" name="bookingType" defaultValue={asText(item.sourceRecord?.bookingType) || "APPOINTMENT"} />
                      <LabeledTextArea label="Notes" name="notes" defaultValue={asText(item.sourceRecord?.specialRequests)} />
                      <ActionButton disabled={isPending} label="Approve booking" />
                    </form>
                  ) : null}

                  {item.reviewItem.sourceType === "VoiceOrderRequest" ? (
                    <form className="mt-4 space-y-4" onSubmit={(event) => handleApproveOrder(event, item)}>
                      <LabeledInput label="Customer name" name="name" defaultValue={asText(snapshot.name) || asText(item.sourceRecord?.customerName)} />
                      <LabeledInput label="Phone" name="phone" defaultValue={asText(snapshot.phone) || asText(item.sourceRecord?.customerPhone)} />
                      <LabeledInput label="Email" name="email" defaultValue={asText(snapshot.email)} />
                      <LabeledTextArea label="Order notes" name="notes" defaultValue={asText(item.sourceRecord?.orderDetailsText)} />
                      <div className="space-y-2">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Approved product quantities</div>
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-[20px] border border-outline-variant/20 p-3">
                          {products.map((product) => (
                            <div key={product.id} className="grid grid-cols-[1fr,110px] items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface px-3 py-2">
                              <div>
                                <div className="font-semibold text-on-surface">{product.name}</div>
                                <div className="text-xs text-on-surface-variant">{item.reviewItem.currency} {product.unitPrice.toFixed(2)}</div>
                              </div>
                              <input
                                name={`qty:${product.id}`}
                                type="number"
                                min="0"
                                step="1"
                                defaultValue="0"
                                className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <ActionButton disabled={isPending} label="Approve order draft" />
                    </form>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Resolution controls</div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <ActionPill
                      disabled={isPending}
                      label="Request info"
                      onClick={() => handleReasonAction(item, "What information is still missing?", requestVoiceReviewInformationAction)}
                    />
                    <ActionPill
                      disabled={isPending}
                      label="Assign callback"
                      onClick={() => handleReasonAction(item, "Why should this be sent back for callback?", assignVoiceReviewCallbackAction)}
                    />
                    <ActionPill
                      disabled={isPending}
                      label="Retry"
                      onClick={() => handleReasonAction(item, "Why is this retry being queued?", retryVoiceReviewAction)}
                    />
                    <ActionPill
                      disabled={isPending}
                      label="Reject"
                      tone="danger"
                      onClick={() => handleReasonAction(item, "Why is this request being rejected?", rejectVoiceReviewAction)}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Audit history</div>
                  <div className="mt-4 space-y-3">
                    {item.transitions.map((transition) => (
                      <div key={transition.id} className="rounded-2xl border border-outline-variant/10 bg-surface px-3 py-3 text-sm">
                        <div className="font-semibold text-on-surface">
                          {(transition.previousStatus || "captured").toUpperCase()} to {transition.newStatus.toUpperCase()}
                        </div>
                        <div className="mt-1 text-on-surface-variant">{transition.reason || "No reason recorded."}</div>
                        <div className="mt-2 text-xs text-on-surface-variant">
                          {transition.actorRole || "system"} • {new Date(transition.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function InfoList({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values: Array<[string, unknown]>;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{title}</div>
      {values.length === 0 ? (
        <div className="mt-3 text-sm text-on-surface-variant">{emptyLabel}</div>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
          {values.map(([key, value]) => (
            <div key={key}>
              <span className="font-black uppercase tracking-[0.14em] text-on-surface">{key.replace(/_/g, " ")}</span>
              {" "}
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StringList({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{title}</div>
      {values.length === 0 ? (
        <div className="mt-3 text-sm text-on-surface-variant">{emptyLabel}</div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none"
      />
    </label>
  );
}

function ActionButton({ disabled, label }: { disabled: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function ActionPill({
  disabled,
  label,
  tone = "default",
  onClick,
}: {
  disabled: boolean;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60",
        tone === "danger"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
          : "border-outline-variant/20 bg-surface text-on-surface",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
