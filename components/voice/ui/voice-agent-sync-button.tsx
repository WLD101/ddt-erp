"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncVoiceTrainingPromptAction } from "@/modules/voice/actions";

export function VoiceAgentSyncButton({
  voiceAgentId,
  disabled,
}: {
  voiceAgentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || isPending}
      className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/30"
      onClick={() =>
        startTransition(async () => {
          const result = await syncVoiceTrainingPromptAction({ voiceAgentId });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Business-specific assistant prompt synced to Vapi.");
          router.refresh();
        })
      }
    >
      {isPending ? "Syncing..." : "Sync to Vapi"}
    </Button>
  );
}
