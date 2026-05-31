"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WARNING_LEAD_MS = 60 * 1000;

export function SecuritySessionGuard({
  idleTimeoutMinutes,
}: {
  idleTimeoutMinutes?: number | null;
}) {
  const idleTimeoutMs = useMemo(
    () => (idleTimeoutMinutes && idleTimeoutMinutes > 0 ? idleTimeoutMinutes * 60 * 1000 : null),
    [idleTimeoutMinutes],
  );
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!idleTimeoutMs) return;

    const touch = () => {
      setLastActivityAt(Date.now());
      setWarningOpen(false);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
      "focus",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, touch, { passive: true }));

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityAt;
      const remaining = idleTimeoutMs - idleFor;

      if (remaining <= 0) {
        void signOut({ callbackUrl: "/auth/signin?callbackUrl=/dashboard" });
        return;
      }

      if (remaining <= WARNING_LEAD_MS) {
        setSecondsRemaining(Math.max(1, Math.ceil(remaining / 1000)));
        setWarningOpen(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, touch));
    };
  }, [idleTimeoutMs, lastActivityAt]);

  if (!idleTimeoutMs) {
    return null;
  }

  return (
    <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
      <DialogContent className="max-w-md rounded-3xl border border-outline-variant/30 bg-surface p-0 text-on-surface shadow-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-black tracking-tight">Security timeout warning</DialogTitle>
          <DialogDescription className="text-sm font-medium text-on-surface-variant">
            Your workspace session is about to end because of inactivity. Stay signed in to continue safely.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2 pt-2">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-700">
            Auto sign-out in {secondsRemaining} second{secondsRemaining === 1 ? "" : "s"}.
          </div>
        </div>
        <DialogFooter className="rounded-b-3xl border-t border-outline-variant/20 bg-surface-container-low/40">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => void signOut({ callbackUrl: "/auth/signin?callbackUrl=/dashboard" })}
          >
            Sign out now
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-primary text-on-primary"
            onClick={() => {
              setLastActivityAt(Date.now());
              setWarningOpen(false);
            }}
          >
            Stay signed in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
