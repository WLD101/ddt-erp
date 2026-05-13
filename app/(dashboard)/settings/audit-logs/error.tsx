"use client";

import { Button } from "@/components/ui/button";

export default function AuditLogsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/8 p-8">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">Audit logs unavailable</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-on-surface">We couldn&apos;t load audit logs right now.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
        Please refresh the page or contact your workspace administrator if the issue continues.
      </p>
      <div className="mt-6">
        <Button onClick={() => reset()} className="rounded-2xl">
          Try again
        </Button>
      </div>
    </div>
  );
}
