// modules/products/components/product-form.tsx
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
import { Loader2, Package, Tag, DollarSign, ShieldAlert } from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
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
            <Input className="bg-white/5 border-white/10" />
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="sku" 
            label="SKU / Reference" 
            placeholder="Unique identifier"
          >
            <Input className="bg-white/5 border-white/10 italic" />
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="categoryId" 
            label="Category"
          >
            <Select onValueChange={(val) => form.setValue("categoryId", val)} defaultValue={form.getValues("categoryId")}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Classify product" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
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
            label="Cost Basis ($)"
          >
            <Input type="number" step="0.01" className="bg-emerald-500/5 border-emerald-500/10" />
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="unitPrice" 
            label="Selling Target ($)"
          >
            <Input type="number" step="0.01" className="bg-primary/5 border-primary/10 font-bold" />
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
            <Input type="number" className="bg-amber-500/5 border-amber-500/10 md:max-w-[200px]" />
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 text-md font-extrabold uppercase tracking-widest shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : initialData ? "Save Changes" : "Register Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
