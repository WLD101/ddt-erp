// modules/products/components/product-form.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useTransition } from "react";
import { createProduct, updateProduct } from "../actions";
import { toast } from "sonner";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { usePlanModal } from "@/components/billing/PlanProvider";

interface ProductFormProps {
  categories: { id: string; name: string }[];
  initialData?: any;
  onSuccess?: () => void;
}

export function ProductForm({ categories, initialData, onSuccess }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      categoryId: initialData?.categoryId || undefined,
      unitPrice: initialData?.unitPrice || 0,
      costPrice: initialData?.costPrice || 0,
      lowStockThreshold: initialData?.lowStockThreshold || 10,
    },
  });

  const { showLimitModal } = usePlanModal();

  function onSubmit(data: ProductFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updateProduct(initialData.id, data)
        : await createProduct(data);

      if (result.success) {
        toast.success(initialData ? "Product updated" : "Product created");
        if (!initialData) form.reset();
        onSuccess?.();
      } else {
        if (result.error.includes("Plan Limit Reached")) {
          showLimitModal("Products", result.error);
        } else {
          toast.error(result.error || "Operation failed");
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection 
          title="Product Essentials" 
          description="Basic identifiers for catalog management"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="name" 
            label="Product Name" 
            placeholder="E.g. High Performance Server"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">inventory_2</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="sku" 
            label="SKU / Reference" 
            placeholder="Unique identifier"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">barcode</span>
              <Input className="pl-10 font-mono text-xs uppercase" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="categoryId" 
            label="Category"
          >
            <Select onValueChange={(val) => form.setValue("categoryId", val)} defaultValue={form.getValues("categoryId")}>
              <SelectTrigger>
                <SelectValue placeholder="Classify product" />
              </SelectTrigger>
              <SelectContent className="bg-white border-outline-variant shadow-lg rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Financial Intelligence" 
          description="Standard purchase and markup definitions"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="costPrice" 
            label="Cost Basis (Rs.)"
          >
             <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">payments</span>
              <Input type="number" step="0.01" className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="unitPrice" 
            label="Selling Target (Rs.)"
          >
             <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-primary">universal_currency</span>
              <Input type="number" step="0.01" className="pl-10 font-black" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Inventory Controls" 
          description="Operational safety thresholds"
          columns={1}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="lowStockThreshold" 
            label="Alert Threshold"
            description="System will flag for replenishment when stock dips below this value"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-error">warning</span>
              <Input type="number" className="pl-10 md:max-w-[200px]" />
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
            ) : initialData ? "Save Changes" : "Register Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
