import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  hideText?: boolean;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export function BrandLogo({ hideText = false, size = "md", dark = false, className, ...props }: BrandLogoProps) {
  const sizeClasses = {
    sm: { shell: "h-10 w-10 rounded-2xl", image: "h-8 w-8", title: "text-xl", subtitle: "text-[9px]" },
    md: { shell: "h-14 w-14 rounded-[1.35rem]", image: "h-12 w-12", title: "text-[1.95rem]", subtitle: "text-[10px]" },
    lg: { shell: "h-[4.35rem] w-[4.35rem] rounded-[1.6rem]", image: "h-[3.6rem] w-[3.6rem]", title: "text-[2.15rem]", subtitle: "text-[11px]" },
  };

  const dims = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3 logo-shimmer", className)} {...props}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(235,242,255,0.92))] shadow-[0_18px_40px_-24px_rgba(18,60,168,0.8)] ring-1 ring-primary/8 transition-all",
          dims.shell,
          dark ? "backdrop-blur-sm" : "bg-white"
        )}
      >
        <Image
          src="/logo3.png"
          alt="WhatsQuery Logo"
          width={160}
          height={160}
          priority={size !== "sm"}
          className={cn("object-contain drop-shadow-[0_8px_24px_rgba(21,65,183,0.2)]", dims.image)}
        />
      </div>
      {!hideText && (
        <div className="min-w-0 leading-none">
          <p className={cn("font-black tracking-tight", dims.title, dark ? "text-white" : "text-slate-950")}>
            WhatsQuery
          </p>
          <p
            className={cn(
              "mt-1 font-black uppercase tracking-[0.28em] text-primary/90",
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
