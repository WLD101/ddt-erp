import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  hideText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ hideText = false, size = "md", className, ...props }: BrandLogoProps) {
  const sizeClasses = {
    sm: {
      container: "h-8 w-8 rounded-xl text-lg",
      text: "text-lg",
      sub: "text-[8px]",
      gap: "gap-3"
    },
    md: {
      container: "w-12 h-12 rounded-2xl text-2xl",
      text: "text-xl",
      sub: "text-[10px]",
      gap: "gap-4"
    },
    lg: {
      container: "w-16 h-16 rounded-3xl text-3xl",
      text: "text-2xl",
      sub: "text-[11px]",
      gap: "gap-5"
    }
  };

  const config = sizeClasses[size];

  return (
    <div className={cn("flex items-center", config.gap, className)} {...props}>
      <div className={cn(
        "bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-on-primary font-black tracking-tighter transition-transform duration-300", 
        config.container
      )}>
        W
      </div>
      {!hideText && (
        <div>
          <h1 className={cn("text-on-surface font-black leading-none tracking-tight font-headline-sm", config.text)}>
            WhatsQuery
          </h1>
          <p className={cn("font-black text-primary uppercase tracking-[0.2em] mt-1", config.sub)}>
            ERP Platform
          </p>
        </div>
      )}
    </div>
  );
}
