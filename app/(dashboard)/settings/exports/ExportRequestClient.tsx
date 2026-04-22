"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { requestExportAction } from "@/modules/exports/actions";
import { Button } from "@/components/ui/button";

export function ExportRequestClient() {
  const [scope, setScope] = useState("tenant_summary");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await requestExportAction(scope);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Export request submitted for admin approval.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5 rounded-lg border border-white/10 bg-black/40 p-6">
      <div className="space-y-2">
        <label htmlFor="scope" className="text-sm font-bold text-white/70">Export scope</label>
        <select
          id="scope"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white"
        >
          <option value="tenant_summary">Tenant summary</option>
          <option value="customers">Customers</option>
          <option value="sales">Sales</option>
        </select>
      </div>
      <Button disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Request Export
      </Button>
    </form>
  );
}
