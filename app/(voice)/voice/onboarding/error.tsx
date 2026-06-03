"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Voice Onboarding Page Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-950 text-slate-50">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong in Onboarding!</h2>
      <pre className="mb-8 max-w-2xl overflow-auto rounded bg-slate-900 p-4 text-sm text-red-400">
        {error.message || String(error)}
      </pre>
      <Button onClick={() => reset()} className="bg-cyan-500 text-slate-950">
        Try again
      </Button>
    </div>
  );
}
