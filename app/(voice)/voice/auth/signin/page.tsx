"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signInAction } from "@/modules/auth/actions";

function VoiceSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/voice/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append("callbackUrl", callbackUrl);

    try {
      const result = await signInAction(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.requiresTwoFactor && result?.next) {
        router.push(result.next);
      } else if (result?.next) {
        router.push(result.next);
      } else {
        // If signIn inside signInAction doesn't throw or return error, we assume success
        toast.success("Signed in successfully.");
        router.push(callbackUrl);
      }
    } catch (err: any) {
      if (err.message !== "NEXT_REDIRECT") {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to your AI receptionist workspace</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
            {/* The ERP forgot password works fine for Voice right now since it's shared identity */}
            <Link href="/auth/forgot-password" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition-all hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </button>
      </form>


    </div>
  );
}

export default function VoiceSignInPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-500" />}>
      <VoiceSignInForm />
    </Suspense>
  );
}
