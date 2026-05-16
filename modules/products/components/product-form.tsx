// modules/products/components/product-form.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues, PRODUCT_UNITS_BY_TYPE, PRODUCT_UNIT_TYPES } from "../schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition } from "react";
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
      openingQuantity: initialData?.openingQuantity ?? initialData?.inventoryItems?.[0]?.quantity ?? 0,
      unitType: initialData?.unitType || "RETAIL_QUANTITY",
      unit: initialData?.unit || PRODUCT_UNITS_BY_TYPE.RETAIL_QUANTITY[0],
    },
  });

  const { showLimitModal } = usePlanModal();
  const selectedUnitType = form.watch("unitType");
  const unitOptions = PRODUCT_UNITS_BY_TYPE[selectedUnitType ?? "RETAIL_QUANTITY"] ?? PRODUCT_UNITS_BY_TYPE.RETAIL_QUANTITY;

  function onSubmit(data: ProductFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updateProduct({ id: initialData.id, ...data })
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
              <SelectContent className="border-outline-variant shadow-lg rounded-xl">
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
          description="Operational safety thresholds and stocking rules"
          columns={3}
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

          <FormFieldWrapper
            control={form.control}
            name="openingQuantity"
            label="Quantity"
            description="Current stock for the active branch or location."
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-primary">inventory</span>
              <Input type="number" min="0" step="0.01" className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper
            control={form.control}
            name="unitType"
            label="Unit Type"
            description="Choose the measurement family that matches this product."
          >
            <Select
              onValueChange={(val) => {
                form.setValue("unitType", val as ProductFormValues["unitType"]);
                form.setValue("unit", PRODUCT_UNITS_BY_TYPE[val as keyof typeof PRODUCT_UNITS_BY_TYPE][0]);
              }}
              defaultValue={form.getValues("unitType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a unit type" />
              </SelectTrigger>
              <SelectContent className="border-outline-variant shadow-lg rounded-xl">
                {PRODUCT_UNIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        </FormSection>

        <FormSection
          title="Unit Definition"
          description="Keep retail, textile, weight, length, and volume items understandable for staff."
          columns={2}
        >
          <FormFieldWrapper
            control={form.control}
            name="unit"
            label="Unit"
            description="Shown throughout the product catalog and inventory views."
          >
            <Select onValueChange={(val) => form.setValue("unit", val)} defaultValue={form.getValues("unit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent className="border-outline-variant shadow-lg rounded-xl">
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
