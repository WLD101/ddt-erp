"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Headphones, LifeBuoy, Loader2, MessageSquareWarning, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestLiveSupport } from "@/modules/support/actions";

export function SupportLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitLiveSupport() {
    startTransition(async () => {
      const result = await requestLiveSupport({
        message,
        sourcePage: pathname,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Live support request sent. Our team can see your tenant and page context.");
      setMessage("");
      setOpen(false);
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_24px_70px_rgba(0,40,142,0.22)]">
          <div className="bg-linear-to-br from-primary via-[#0647d9] to-[#16a8ff] px-5 py-5 text-on-primary">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">WhatsQuery Support</p>
                <h2 className="mt-2 text-xl font-black tracking-tight">How can we help?</h2>
                <p className="mt-2 text-xs font-medium leading-5 text-white/80">
                  Request human help now or open a detailed support ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Close support options"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Headphones className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-on-surface">Live support</h3>
                  <p className="text-xs leading-5 text-on-surface-variant">Ask our team to attend you from the admin dashboard.</p>
                </div>
              </div>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Optional: Tell us what you need help with..."
                className="mt-4 min-h-[86px] rounded-2xl bg-surface"
                disabled={isPending}
              />
              <Button
                type="button"
                onClick={submitLiveSupport}
                disabled={isPending}
                className="mt-3 h-11 w-full rounded-2xl text-[11px] font-black uppercase tracking-[0.18em]"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LifeBuoy className="mr-2 h-4 w-4" />}
                Request Human Support
              </Button>
            </div>

            <Link
              href="/dashboard/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-3xl border border-outline-variant/30 bg-surface-container-low p-4 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <MessageSquareWarning className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-on-surface">Report an issue</span>
                <span className="block text-xs leading-5 text-on-surface-variant">Open a ticket with reason, priority, and details.</span>
              </span>
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-linear-to-br from-white via-[#edf5ff] to-[#dbeaff] shadow-[0_18px_40px_rgba(0,40,142,0.28)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(0,40,142,0.34)]"
        aria-expanded={open}
        aria-label="Open WhatsQuery Support"
      >
        <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 blur-xl transition group-hover:opacity-100" />
        <Image
          src="/whatsquery-support-icon.png"
          alt="WhatsQuery Support"
          width={70}
          height={70}
          className="relative z-10 object-contain"
          priority={false}
        />
        <span className="absolute -top-1 -right-1 rounded-full bg-secondary px-2 py-1 text-[9px] font-black uppercase tracking-wider text-on-secondary shadow-soft">
          Help
        </span>
      </button>
    </div>
  );
}
