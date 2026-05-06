// modules/products/components/category-form.tsx
"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCategory } from "../actions";
import { toast } from "sonner";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSuccess?: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      const result = await createCategory(data);
      if (result.success) {
        toast.success("Category created successfully");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create category");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection 
          title="Taxonomy Definition" 
          description="Basic classification for product grouping"
          columns={1}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="name" 
            label="Category Name"
            placeholder="e.g. Raw Materials, Electronics..."
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">sell</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="description" 
            label="Internal Notes"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">description</span>
              <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">description</span>
              <Textarea 
                placeholder="Optional description for staff reference..." 
                className="pl-10 min-h-[100px] resize-none" 
              />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="px-8"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : "Establish Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
