import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { VoiceOrderReceiptPrintButton } from "./print-button";

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "To be confirmed";
  return `Rs. ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function splitOrderLines(details: string) {
  return details
    .split(/\r?\n|,\s*(?=\d|\w)/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function VoiceOrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const order = await prisma.voiceOrderRequest.findFirst({
    where: {
      id,
      organizationId: ctx.organizationId,
    },
    include: {
      organization: {
        select: {
          name: true,
          phone: true,
          city: true,
          country: true,
          voiceBusinessProfile: true,
        },
      },
    },
  });

  if (!order) return notFound();

  const callLog = order.providerCallId
    ? await prisma.voiceCallLog.findFirst({
        where: {
          organizationId: ctx.organizationId,
          providerCallId: order.providerCallId,
        },
        select: {
          id: true,
          recordingUrl: true,
          callerNumber: true,
          durationSeconds: true,
          summary: true,
        },
      })
    : null;

  const businessName = order.organization.voiceBusinessProfile?.businessName || order.organization.name;
  const businessPhone = order.organization.voiceBusinessProfile?.businessPhone || order.organization.phone;
  const orderLines = splitOrderLines(order.orderDetailsText);
  const recordingHref = callLog?.recordingUrl ? `/api/voice/call-logs/${callLog.id}/recording` : null;

  return (
    <main className="min-h-screen bg-surface-container-low px-4 py-8 text-on-surface">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: 80mm auto; margin: 4mm; }
            @media print {
              body { background: white !important; }
              .no-print { display: none !important; }
              .receipt-paper {
                width: 72mm !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
            }
          `,
        }}
      />

      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <Link href="/voice/dashboard/orders" className="text-sm font-bold text-primary hover:underline">
          Back to order requests
        </Link>
        <VoiceOrderReceiptPrintButton />
      </div>

      <section className="receipt-paper mx-auto w-full max-w-[340px] rounded-[20px] border border-outline-variant/40 bg-white p-5 font-mono text-[12px] leading-5 text-slate-950 shadow-xl">
        <div className="text-center">
          <div className="text-[15px] font-black uppercase tracking-wider">{businessName}</div>
          {businessPhone ? <div className="mt-1 text-[11px]">{businessPhone}</div> : null}
          {order.organization.city || order.organization.country ? (
            <div className="text-[11px]">
              {[order.organization.city, order.organization.country].filter(Boolean).join(", ")}
            </div>
          ) : null}
          <div className="my-3 border-t border-dashed border-slate-400" />
          <div className="text-[13px] font-black uppercase">Order Request Receipt</div>
          <div className="text-[10px] uppercase tracking-wider">Staff confirmation required</div>
        </div>

        <div className="my-3 border-t border-dashed border-slate-400" />

        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span>Receipt #</span>
            <span className="text-right">{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Date</span>
            <span className="text-right">{formatReceiptDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Status</span>
            <span className="text-right uppercase">{order.status.replaceAll("_", " ")}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-slate-400" />

        <div className="space-y-1">
          <div className="font-black uppercase">Customer</div>
          <div>{order.customerName || "Walk-in caller"}</div>
          <div>{order.customerPhone || callLog?.callerNumber || "Phone not captured"}</div>
          {order.customerAddress ? <div>{order.customerAddress}</div> : null}
        </div>

        <div className="my-3 border-t border-dashed border-slate-400" />

        <div className="space-y-2">
          <div className="font-black uppercase">Order Details</div>
          {orderLines.length > 0 ? (
            orderLines.map((line, index) => (
              <div key={`${line}-${index}`} className="flex gap-2">
                <span>{index + 1}.</span>
                <span>{line}</span>
              </div>
            ))
          ) : (
            <div>{order.orderDetailsText}</div>
          )}
        </div>

        <div className="my-3 border-t border-dashed border-slate-400" />

        <div className="flex justify-between gap-4 text-[13px] font-black">
          <span>Estimated Total</span>
          <span className="text-right">{formatCurrency(order.totalEstimated)}</span>
        </div>

        <div className="my-3 border-t border-dashed border-slate-400" />

        <div className="space-y-1 text-[10px] leading-4">
          <div>This receipt confirms that the AI receptionist captured an order request.</div>
          <div>It is not a tax invoice, payment receipt, or final order confirmation.</div>
          <div>The business team must confirm availability, price, timing, and payment before preparing the order.</div>
        </div>

        {recordingHref ? (
          <div className="no-print mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 font-sans text-xs">
            <div className="mb-2 font-bold text-slate-700">Customer call recording</div>
            <audio controls src={recordingHref} className="w-full">
              <a href={recordingHref}>Open recording</a>
            </audio>
          </div>
        ) : null}

        <div className="mt-4 text-center text-[10px] uppercase tracking-wider">Powered by WhatsQuery Voice</div>
      </section>
    </main>
  );
}
