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
  children: React.ReactElement;
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
            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
              {label}
            </FormLabel>
          )}
          <FormControl>
            {React.cloneElement(children, { ...field })}
          </FormControl>
          {description && (
            <FormDescription className="text-[10px] text-muted-foreground/60 italic ml-1 leading-tight">
              {description}
            </FormDescription>
          )}
          <FormMessage className="text-[10px] font-bold text-rose-500 ml-1" />
        </FormItem>
      )}
    />
  );
}
