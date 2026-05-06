"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, ShieldCheck, SkipForward, UserPlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteSchema } from "@/modules/onboarding/service";
import { skipOnboardingStep } from "@/modules/onboarding/actions";

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
          <UserPlus className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            Invite <span className="text-cyan-500">Your Team</span>
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Add a staff member or admin now, or skip and do it later from Settings - Team.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="h-12 border-outline-variant/30 bg-surface-container-low pl-10"
              placeholder="colleague@yourbiz.com"
              type="email"
            />
          </div>
          {error ? <p className="mt-1 text-xs font-bold text-rose-500">{error}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Role</label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger className="h-12 border-outline-variant/30 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-on-surface-variant/50" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="border-outline-variant/30 bg-surface">
              <SelectItem value="admin">Admin - Can manage most settings</SelectItem>
              <SelectItem value="staff">Staff - Operational access only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleInvite}
          disabled={isPending || !email}
          className="h-14 flex-1 rounded-2xl bg-cyan-600 font-black uppercase tracking-widest text-on-surface transition-all active:scale-95 hover:bg-cyan-700"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Invite <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={isSkipping}
          className="h-14 rounded-2xl border-outline-variant/30 bg-surface px-5 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low"
        >
          {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

