"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingProductSchema } from "@/modules/onboarding/service";
import { saveOnboardingProduct, skipOnboardingStep } from "@/modules/onboarding/actions";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Package, Loader2, ArrowRight, SkipForward, Hash, DollarSign, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function ProductStep({ stepId, onComplete, onSkip }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSkipping, startSkip] = useTransition();

  const form = useForm<z.infer<typeof onboardingProductSchema>>({
    resolver: zodResolver(onboardingProductSchema),
    defaultValues: { unitPrice: 0, costPrice: 0, openingStock: 1, lowStockThreshold: 5 },
  });

  const onSubmit = (data: z.infer<typeof onboardingProductSchema>) => {
    startTransition(async () => {
      const result = await saveOnboardingProduct(data);
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
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Package className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            First <span className="text-amber-400">Product</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add one product to start. You can add more from the Products section. Keep it simple.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="name" label="Product Name *">
              <Input className="bg-white/5 border-white/10 h-12" placeholder="e.g. Cotton T-Shirt 100g" />
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="sku" label="SKU (optional)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-12" placeholder="e.g. SKU-001" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="unitPrice" label="Selling Price (USD) *">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input type="number" step="0.01" min="0" className="pl-10 bg-white/5 border-white/10 h-12" placeholder="0.00" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="costPrice" label="Cost Price (USD)">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/50" />
                <Input type="number" step="0.01" min="0" className="pl-10 bg-white/5 border-white/10 h-12" placeholder="0.00" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="openingStock" label="Opening Stock (units)">
              <Input type="number" min="0" className="bg-white/5 border-white/10 h-12" />
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="lowStockThreshold" label="Low Stock Alert At">
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input type="number" min="0" className="pl-10 bg-white/5 border-white/10 h-12" />
              </div>
            </FormFieldWrapper>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-14 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest transition-all active:scale-95"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Add Product <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isSkipping}
              className="h-14 px-5 bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              {isSkipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
