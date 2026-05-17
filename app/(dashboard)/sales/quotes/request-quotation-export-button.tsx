"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestExportAction } from "@/modules/exports/actions";

export function RequestQuotationExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const result = await requestExportAction("quotations");
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Quotation export request submitted for admin approval.");
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
      className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-outline-variant/30"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px] mr-2">ios_share</span>}
      Request Export
    </Button>
  );
}
