import Link from "next/link";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getWhatsappTenantOverview } from "@/modules/voice/whatsapp/service";

export default async function VoiceWhatsappInboxPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const { conversations, messages, openHandoffs } = await getWhatsappTenantOverview(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">WhatsApp Inbox</p>
            <h1 className="mt-2 text-3xl font-black text-on-surface">Customer conversations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
              Tenant-scoped WhatsApp messages, AI replies, lead captures, booking requests, order requests, and human handoffs.
            </p>
          </div>
          <Link href="/voice/dashboard/integrations/whatsapp" className="rounded-2xl border border-outline-variant/40 px-4 py-3 text-sm font-black text-on-surface">
            WhatsApp setup
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Conversations</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{conversations.length}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Messages loaded</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{messages.length}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Open handoffs</p>
          <p className="mt-2 text-3xl font-black text-on-surface">{openHandoffs}</p>
        </div>
        <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Channel</p>
          <p className="mt-2 text-xl font-black text-on-surface">WhatsApp</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-5 shadow-xs">
          <h2 className="text-xl font-black text-on-surface">Recent conversations</h2>
          <div className="mt-5 space-y-3">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
                No WhatsApp conversations yet. Once Meta webhooks arrive, messages will appear here.
              </div>
            ) : (
              conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-on-surface">{conversation.contactName || conversation.contactWaId}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{conversation.lastMessagePreview || "No preview"}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                      {conversation.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                    {conversation.handoffRequested ? <span>Handoff</span> : null}
                    {conversation.orderRequested ? <span>Order</span> : null}
                    {conversation.appointmentRequested ? <span>Booking</span> : null}
                    <span>{conversation.lastMessageAt ? conversation.lastMessageAt.toLocaleString() : "No date"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/30 bg-surface p-5 shadow-xs">
          <h2 className="text-xl font-black text-on-surface">Recent messages</h2>
          <div className="mt-5 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
                No WhatsApp messages have been stored yet.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${message.direction === "INBOUND" ? "bg-blue-500/10 text-blue-700" : "bg-emerald-500/10 text-emerald-700"}`}>
                      {message.direction}
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant">{message.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-on-surface">{message.body || "No text body"}</p>
                  {message.errorMessage ? <p className="mt-2 text-xs font-semibold text-amber-700">{message.errorMessage}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
