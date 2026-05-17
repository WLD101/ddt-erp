"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[reports-route-error]", error);
  }, [error]);

  return (
    <div className="pb-20">
      <Card className="rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <CardHeader className="border-b border-outline-variant/10 bg-surface-container-lowest">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-on-surface">
            <AlertCircle className="h-4 w-4 text-primary" />
            Reports unavailable
          </CardTitle>
          <CardDescription className="text-sm font-medium text-on-surface-variant">
            We couldn&apos;t load reports right now. Please try again or return to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface px-5 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface shadow-soft transition-colors hover:bg-surface-container-low"
          >
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
