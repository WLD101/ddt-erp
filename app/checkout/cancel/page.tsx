import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const retryHref = params.plan ? `/checkout?plan=${encodeURIComponent(params.plan)}` : "/checkout";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center px-6 py-12">
      <Card className="glass-card w-full rounded-[32px] border border-white/10">
        <CardHeader className="space-y-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Checkout cancelled</p>
          <CardTitle className="text-4xl font-black tracking-tight text-white">No payment was taken</CardTitle>
          <CardDescription className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            You can retry checkout at any time. Your package selection is still saved for this onboarding session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={retryHref}
            className="marketing-button-primary inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white"
          >
            Retry payment
          </Link>
          <Link
            href="/onboarding/packages"
            className="marketing-button-secondary inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold text-white"
          >
            Change package
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
