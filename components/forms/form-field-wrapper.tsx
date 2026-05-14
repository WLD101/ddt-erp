// components/forms/form-field-wrapper.tsx
"use client";

import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldWrapperProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  children: React.ReactElement<any>;
  className?: string;
}

export function FormFieldWrapper<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  children,
  className,
}: FormFieldWrapperProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          {label && (
            <FormLabel className="ml-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {label}
            </FormLabel>
          )}
          <FormControl>
            {React.cloneElement(children, field as Record<string, unknown>)}
          </FormControl>
          {description && (
            <FormDescription className="ml-1 text-[10px] italic leading-tight text-on-surface-variant/80">
              {description}
            </FormDescription>
          )}
          <FormMessage className="ml-1 text-[10px] font-bold text-error" />
        </FormItem>
      )}
    />
  );
}
