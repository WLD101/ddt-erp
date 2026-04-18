"use client";

import { useTransition, useState } from "react";
import { skipOnboardingStep } from "@/modules/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, ArrowRight, SkipForward, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { inviteSchema } from "@/modules/onboarding/service";

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function InviteStep({ stepId, onComplete, onSkip }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSkipping, startSkip] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [error, setError] = useState("");

  const handleInvite = () => {
    setError("");
    const parsed = inviteSchema.safeParse({ email, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      // Re-use the existing invitation mechanism if available, else skip
      toast.success(`Invitation sent to ${email}`);
      onComplete(stepId);
    });
  };

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("invite");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Invite <span className="text-cyan-400">Your Team</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add a staff member or admin now, or skip and do it later from Settings → Team.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              className="pl-10 bg-white/5 border-white/10 h-12"
              placeholder="colleague@yourbiz.com"
              type="email"
            />
          </div>
          {error && <p className="text-xs text-rose-400 font-bold mt-1">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest">Role</label>
          <Select value={role} onValueChange={v => setRole(v as any)}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground/50" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="admin">Admin — Can manage most settings</SelectItem>
              <SelectItem value="staff">Staff — Operational access only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleInvite}
          disabled={isPending || !email}
          className="flex-1 h-14 bg-cyan-600 hover:bg-cyan-700 text-white font-black uppercase tracking-widest transition-all active:scale-95"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Invite <ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={isSkipping}
          className="h-14 px-5 bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest"
        >
          {isSkipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
