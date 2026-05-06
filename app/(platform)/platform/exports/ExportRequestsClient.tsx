"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveExportRequestAction, rejectExportRequestAction } from "@/modules/exports/actions";
import { Button } from "@/components/ui/button";

export function ExportRequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function approve() {
    setIsLoading("approve");
    try {
      const result = await approveExportRequestAction(id);
      if (!result.success) {
        toast.error(String("error" in result ? result.error : "Failed to approve export"));
        return;
      }
      toast.success("Export approved. Token generated.");
      if (result.token) {
        window.prompt("Approved download URL", `${window.location.origin}/api/export/approved/${result.token}`);
      }
      router.refresh();
    } finally {
      setIsLoading(null);
    }
  }

  async function reject() {
    setIsLoading("reject");
    try {
      const result = await rejectExportRequestAction(id);
      if (!result.success) {
        toast.error(String("error" in result ? result.error : "Failed to reject export"));
        return;
      }
      toast.success("Export rejected.");
      router.refresh();
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" onClick={approve} disabled={isLoading !== null}>
        {isLoading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Approve
      </Button>
      <Button size="sm" variant="ghost" onClick={reject} disabled={isLoading !== null} className="text-rose-400 hover:text-rose-300">
        {isLoading === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Reject
      </Button>
    </div>
  );
}
