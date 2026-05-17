"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestExportAction } from "@/modules/exports/actions";

export function RequestCustomersExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestExport = async () => {
    setIsLoading(true);
    try {
      const result = await requestExportAction("customers");
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Customer export request submitted for admin approval.");
    } catch (error) {
      console.error("[customers-export] request failed", error);
      toast.error("We couldn't submit the customer export request right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRequestExport}
      disabled={isLoading}
      className="h-10 rounded-xl px-5 text-sm font-bold"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="material-symbols-outlined mr-2 text-[18px]">download</span>}
      Request Export
    </Button>
  );
}
