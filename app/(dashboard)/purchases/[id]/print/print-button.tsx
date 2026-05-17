"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button
      size="sm"
      onClick={() => window.print()}
      className="bg-primary text-on-primary hover:bg-primary/90"
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
