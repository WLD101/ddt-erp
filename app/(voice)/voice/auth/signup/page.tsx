"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { requestVoiceSignupOtpAction } from "@/modules/auth/voice-actions";

export default function VoiceSignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const result = await requestVoiceSignupOtpAction(data);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.next) {
        toast.success(result.success || "OTP sent.");
        router.push(result.next);
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/50 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-white">Create your AI Receptionist</h1>
        <p className="mt-2 text-sm text-slate-400">Set up your workspace and start receiving AI-managed calls</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              name="name"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="jane@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Name</label>
            <input
              name="organizationName"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Phone</label>
            <input
              name="phone"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="+1 555 123 4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Type</label>
            <select
              name="businessType"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors [&>option]:bg-slate-900"
            >
              <option value="" disabled selected>Select an option</option>
              <option value="Restaurant">Restaurant / Cafe</option>
              <option value="Clinic">Medical Clinic / Dental</option>
              <option value="Salon">Salon / Spa</option>
              <option value="Agency">Agency / Services</option>
              <option value="Retail">Retail Store</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected Call Volume</label>
            <select
              name="callVolume"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors [&>option]:bg-slate-900"
            >
              <option value="" disabled selected>Select an option</option>
              <option value="Low">Low (1-10 calls/day)</option>
              <option value="Medium">Medium (11-50 calls/day)</option>
              <option value="High">High (50+ calls/day)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">City</label>
            <input
              name="city"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="San Francisco"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Country</label>
            <input
              name="country"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              placeholder="United States"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition-all hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Workspace"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Already have a workspace?{" "}
        <Link href="/auth/signin" className="font-bold text-cyan-400 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
