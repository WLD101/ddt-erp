// modules/inventory/components/low-stock-global-alert.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LowStockGlobalAlertProps {
  count: number;
}

export function LowStockGlobalAlert({ count }: LowStockGlobalAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("low-stock-alert-dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
    
    if (count > 0 && !dismissed) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("low-stock-alert-dismissed", "true");
  };

  if (!isVisible || isDismissed || count === 0) return null;

  return (
    <div className={cn(
      "w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 backdrop-blur-md",
      "flex items-center justify-between group animate-in slide-in-from-top duration-500"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest">Stock Criticality Alert</h4>
          <p className="text-sm text-foreground/80 font-medium">
            There are <span className="text-rose-500 font-black">{count}</span> items currently below their safety threshold.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="text-xs font-bold px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all flex items-center gap-2">
          Review Inventory <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button 
          onClick={handleDismiss}
          className="p-2 hover:bg-rose-500/10 rounded-full transition-colors text-rose-500/50 hover:text-rose-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
