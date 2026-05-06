"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Hash, Loader2, MapPin, SkipForward, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { branchSchema } from "@/modules/onboarding/service";
import { saveOnboardingBranch, skipOnboardingStep } from "@/modules/onboarding/actions";

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function BranchStep({ stepId, onComplete, onSkip }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSkipping, startSkip] = useTransition();

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "Main Branch" },
  });

  const onSubmit = (data: z.infer<typeof branchSchema>) => {
    startTransition(async () => {
      const result = await saveOnboardingBranch(data);
      if (result.success) onComplete(stepId);
      else toast.error(result.error || "Failed to create branch");
    });
  };

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("branch");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
          <Warehouse className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            Your <span className="text-emerald-500">Location</span>
          </h1>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-on-surface-variant">
            Set up your first branch or warehouse. If you operate from one location, call it &quot;Main Branch&quot;.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 text-sm text-on-surface-variant">
        <Warehouse className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <p>Branches let you track inventory and sales separately per location. You can add more branches later from Settings.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormFieldWrapper control={form.control} name="name" label="Branch Name *">
            <Input className="h-12 border-outline-variant/30 bg-surface-container-low" placeholder="Main Branch / Downtown Store / Warehouse A" />
          </FormFieldWrapper>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="code" label="Branch Code (optional)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="HQ / DT1 / WH-A" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Address (optional)">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant/50" />
              <Textarea className="min-h-[72px] resize-none border-outline-variant/30 bg-surface-container-low pl-10" placeholder="Street address..." />
            </div>
          </FormFieldWrapper>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-14 flex-1 rounded-2xl bg-emerald-600 font-black uppercase tracking-widest text-on-surface transition-all active:scale-95 hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Branch <ArrowRight className="ml-2 h-4 w-4" /></>}
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

