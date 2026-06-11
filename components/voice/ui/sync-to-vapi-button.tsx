"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncVoiceTrainingPromptAction } from "@/modules/voice/actions";

interface SyncToVapiButtonProps {
  voiceAgentId: string;
  isStale: boolean;
}

export function SyncToVapiButton({ voiceAgentId, isStale }: SyncToVapiButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncVoiceTrainingPromptAction({ voiceAgentId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Successfully updated voice receptionist profile.");
      router.refresh();
    });
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isPending}
      className={`min-w-[140px] ${isStale ? "bg-amber-400 hover:bg-amber-500 text-black" : "bg-cyan-400 hover:bg-cyan-500 text-black"}`}
    >
      {isPending ? "Updating..." : isStale ? "Sync Receptionist (Updates Pending)" : "Sync Receptionist"}
    </Button>
  );
}
