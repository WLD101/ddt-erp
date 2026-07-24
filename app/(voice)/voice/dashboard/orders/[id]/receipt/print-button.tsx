"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VoiceOrderReceiptPrintButton() {
  return (
    <Button type="button" onClick={() => window.print()} className="rounded-xl bg-primary text-on-primary hover:bg-primary/90">
      <Printer className="mr-2 h-4 w-4" />
      Print / Save Receipt
    </Button>
  );
}
