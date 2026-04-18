// components/forms/form-field.tsx
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, description, containerClassName, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("space-y-2 w-full", containerClassName)}>
        <Label 
          htmlFor={inputId} 
          className={cn(
            "text-sm font-semibold tracking-wide transition-colors duration-200",
            error ? "text-destructive" : "text-foreground/80"
          )}
        >
          {label}
        </Label>
        
        <div className="relative group">
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              "bg-background/50 border-white/5 backdrop-blur-sm transition-all duration-300",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "group-hover:border-white/20",
              error && "border-destructive/50 focus:border-destructive focus:ring-destructive/20 bg-destructive/5",
              className
            )}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {description && !error && (
          <p className="text-[11px] text-muted-foreground/60 italic px-1 pt-1 leading-tight">
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-[12px] font-medium text-destructive px-1 pt-1 animate-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Helper for horizontal form rows
export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {children}
    </div>
  );
}
