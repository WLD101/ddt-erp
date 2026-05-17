"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestExportAction } from "@/modules/exports/actions";

export function RequestPurchasesExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const result = await requestExportAction("purchases");
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Purchases export request submitted for admin approval.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRequest}
      disabled={isLoading}
      className="h-10 rounded-xl border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <span className="material-symbols-outlined mr-2 text-[18px]">ios_share</span>
      )}
      Request Export
    </Button>
  );
}
