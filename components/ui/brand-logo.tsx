import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  hideText?: boolean;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export function BrandLogo({ hideText = false, size = "md", dark = false, className, ...props }: BrandLogoProps) {
  const sizeClasses = {
    sm: { h: 32, w: 90 },
    md: { h: 40, w: 120 },
    lg: { h: 56, w: 160 }
  };

  const dims = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3 logo-shimmer", className)} {...props}>
      {/* `next/image` is returning 400s in production for this local logo path, so this public brand mark stays on a plain img to keep auth/marketing routes stable. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo3.png" 
        alt="WhatsQuery Logo"
        width={dims.w}
        height={dims.h}
        className={cn(
          "object-contain logo-glow transition-all",
          dark ? "brightness-200 grayscale contrast-150" : ""
        )}
      />
      {!hideText && (
        <span className={cn("text-xl font-bold tracking-tight", dark ? "text-white" : "text-slate-900")}>
          WhatsQuery
          <span className="text-indigo-500">.com</span>
        </span>
      )}
    </div>
  );
}
