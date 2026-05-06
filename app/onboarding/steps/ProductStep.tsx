"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BarChart3, DollarSign, Hash, Loader2, Package, SkipForward } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Input } from "@/components/ui/input";
import { onboardingProductSchema } from "@/modules/onboarding/service";
import { saveOnboardingProduct, skipOnboardingStep } from "@/modules/onboarding/actions";

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

type ProductStepValues = z.input<typeof onboardingProductSchema>;

export function ProductStep({ stepId, onComplete, onSkip }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSkipping, startSkip] = useTransition();

  const form = useForm<ProductStepValues>({
    resolver: zodResolver(onboardingProductSchema),
    defaultValues: { name: "", sku: "", unitPrice: 0, costPrice: 0, openingStock: 1, lowStockThreshold: 5 },
  });

  const onSubmit = (data: ProductStepValues) => {
    startTransition(async () => {
      const result = await saveOnboardingProduct(onboardingProductSchema.parse(data));
      if (result.success) onComplete(stepId);
      else toast.error(result.error || "Failed to add product");
    });
  };

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("product");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
          <Package className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            First <span className="text-amber-500">Product</span>
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Add one product to start. You can add more from the Products section. Keep it simple.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="name" label="Product Name *">
              <Input className="h-12 border-outline-variant/30 bg-surface-container-low" placeholder="e.g. Cotton T-Shirt 100g" />
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="sku" label="SKU (optional)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-12 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="e.g. SKU-001" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="unitPrice" label="Selling Price (USD) *">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input type="number" step="0.01" min="0" className="h-12 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="0.00" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="costPrice" label="Cost Price (USD)">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input type="number" step="0.01" min="0" className="h-12 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="0.00" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="openingStock" label="Opening Stock (units)">
              <Input type="number" min="0" className="h-12 border-outline-variant/30 bg-surface-container-low" />
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="lowStockThreshold" label="Low Stock Alert At">
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input type="number" min="0" className="h-12 border-outline-variant/30 bg-surface-container-low pl-10" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-14 flex-1 rounded-2xl bg-amber-600 font-black uppercase tracking-widest text-on-surface transition-all active:scale-95 hover:bg-amber-700"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Add Product <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isSkipping}
              className="h-14 rounded-2xl border-outline-variant/30 bg-surface px-5 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low"
            >
              {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

