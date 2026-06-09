"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { verifyVoiceSignupOtpAction, resendVoiceSignupOtpAction } from "@/modules/auth/voice-actions";

function VoiceVerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await verifyVoiceSignupOtpAction({ email, code });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success || "Email verified.");
      router.push(result.next || "/voice/auth/signin");
    } finally {
      setIsLoading(false);
    }
  }

  async function onResend() {
    if (!email) {
      toast.error("Please enter your email address to resend the code.");
      return;
    }
    setIsResending(true);
    try {
      const result = await resendVoiceSignupOtpAction(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Verification code resent successfully.");
      }
    } catch {
      toast.error("Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-white">Check your email</h1>
        <p className="mt-2 text-sm text-slate-400">We sent a 6-digit verification code to <strong className="text-cyan-400">{email || "your address"}</strong></p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            type="email"
            required
            placeholder="name@company.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification Code</label>
          <input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors tracking-[0.5em] text-center text-xl font-black"
            inputMode="numeric"
            minLength={6}
            maxLength={6}
            placeholder="000000"
            autoFocus
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition-all hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Email"}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-sm text-slate-400">
        <button
          onClick={onResend}
          disabled={isResending}
          className="inline-flex items-center gap-2 font-bold text-cyan-400 hover:underline disabled:opacity-50"
        >
          {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Resend Code</span>
        </button>

        <Link href="/voice/auth/signup" className="font-bold text-slate-300 hover:underline">
          Go back to signup
        </Link>
      </div>
    </div>
  );
}

export default function VoiceVerifyOtpPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-500" />}>
      <VoiceVerifyOtpContent />
    </Suspense>
  );
}
