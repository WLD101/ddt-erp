import React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "vertical" | "horizontal" | "compact" | "icon-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean;
  subtitle?: string;
  hideSubtitle?: boolean;
}

export function Logo({
  variant = "vertical",
  size = "md",
  dark = false,
  subtitle = "VOICE AI",
  hideSubtitle = false,
  className,
  ...props
}: LogoProps) {
  // Deeply optimized proportions for enterprise aesthetics
  // Icon sizes increased by ~200% compared to legacy components
  const sizeMap = {
    xs: { image: 36, title: "text-lg", subtitle: "text-[9px] tracking-[0.2em]" },
    sm: { image: 56, title: "text-2xl", subtitle: "text-[10px] tracking-[0.25em]" },
    md: { image: 84, title: "text-4xl", subtitle: "text-[12px] tracking-[0.28em]" },
    lg: { image: 128, title: "text-6xl", subtitle: "text-[15px] tracking-[0.3em]" },
    xl: { image: 180, title: "text-[5.5rem]", subtitle: "text-[20px] tracking-[0.35em]" },
  };

  const current = sizeMap[size];
  const textColor = dark ? "text-white" : "text-slate-950";
  const subtitleColor = dark ? "text-primary/90" : "text-primary";

  const iconElement = (
    <div className={cn("relative flex items-center justify-center shrink-0")}>
      <Image
        src="/logo-emblem.png"
        alt="WhatsQuery Logo"
        width={current.image}
        height={current.image}
        className={cn(
          "object-contain drop-shadow-[0_12px_24px_rgba(21,65,183,0.15)] transition-all duration-300",
          // Optical alignment compensation for circular/asymmetric SVGs
          variant === "vertical" ? "-mb-1" : ""
        )}
        draggable={false}
        priority={size === "lg" || size === "xl"}
      />
    </div>
  );

  const textElement = (
    <div
      className={cn(
        "flex flex-col",
        variant === "vertical" ? "items-center text-center mt-5" : "items-start ml-6"
      )}
    >
      <h1 className={cn("font-black tracking-tight leading-none", current.title, textColor)}>
        WhatsQuery
      </h1>
      {!hideSubtitle && (
        <p className={cn("font-black uppercase mt-2.5", current.subtitle, subtitleColor)}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (variant === "icon-only") {
    return (
      <div className={cn("inline-flex", className)} {...props}>
        {iconElement}
      </div>
    );
  }

  if (variant === "compact") {
    // Ultra-tight horizontal layout suitable for tight navbars
    return (
      <div className={cn("flex items-center gap-3.5", className)} {...props}>
        <Image
          src="/logo-emblem.png"
          alt="WhatsQuery Logo"
          width={Math.round(current.image * 0.75)}
          height={Math.round(current.image * 0.75)}
          style={{ width: current.image * 0.75, height: current.image * 0.75 }}
          className="object-contain drop-shadow-sm"
          draggable={false}
        />
        <div className="flex flex-col items-start justify-center pt-1">
          <h1 className={cn("font-black tracking-tight leading-none", current.title, textColor)}>
            WhatsQuery
          </h1>
          {!hideSubtitle && (
            <p className={cn("font-black uppercase mt-1", current.subtitle, subtitleColor)}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex",
        variant === "vertical" ? "flex-col items-center justify-center" : "flex-row items-center",
        className
      )}
      {...props}
    >
      {iconElement}
      {textElement}
    </div>
  );
}
