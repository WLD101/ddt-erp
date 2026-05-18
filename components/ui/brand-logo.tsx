import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  hideText?: boolean;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export function BrandLogo({ hideText = false, size = "md", dark = false, className, ...props }: BrandLogoProps) {
  const sizeClasses = {
    sm: { mark: "h-8 w-8", title: "text-lg", subtitle: "text-[9px]" },
    md: { mark: "h-10 w-10", title: "text-[2rem]", subtitle: "text-[10px]" },
    lg: { mark: "h-14 w-14", title: "text-[2.3rem]", subtitle: "text-[11px]" },
  };

  const dims = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3 logo-shimmer", className)} {...props}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo3.png"
        alt="WhatsQuery Logo"
        className={cn(
          "rounded-xl object-cover ring-1 ring-primary/10 logo-glow transition-all",
          dims.mark,
          dark ? "bg-white/95" : "bg-white"
        )}
      />
      {!hideText && (
        <div className="min-w-0 leading-none">
          <p className={cn("font-black tracking-tight", dims.title, dark ? "text-white" : "text-slate-900")}>
            WhatsQuery
          </p>
          <p
            className={cn(
              "mt-1 font-black uppercase tracking-[0.28em] text-primary",
              dims.subtitle
            )}
          >
            ERP Platform
          </p>
        </div>
      )}
    </div>
  );
}
