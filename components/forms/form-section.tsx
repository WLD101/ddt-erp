// components/forms/form-section.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

export function FormSection({
  title,
  description,
  children,
  className,
  columns = 2,
}: FormSectionProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  }[columns];

  return (
    <div className={cn("space-y-6 pt-6 first:pt-0", className)}>
      {(title || description) && (
        <div className="space-y-1 px-1">
          {title && (
            <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-on-surface-variant font-medium italic">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn("grid gap-6", gridCols)}>
        {children}
      </div>
    </div>
  );
}
