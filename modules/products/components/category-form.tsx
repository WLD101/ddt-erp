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
import { Loader2, Tag, FileText } from "lucide-react";
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
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-10 bg-white/5 border-white/10 h-11" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="description" 
            label="Internal Notes"
          >
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/60" />
              <Textarea 
                placeholder="Optional description for staff reference..." 
                className="pl-10 bg-white/5 border-white/10 min-h-[100px] resize-none" 
              />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 text-md font-extrabold uppercase tracking-widest"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : "Establish Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
