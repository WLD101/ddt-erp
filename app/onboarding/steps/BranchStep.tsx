"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchSchema } from "@/modules/onboarding/service";
import { saveOnboardingBranch, skipOnboardingStep } from "@/modules/onboarding/actions";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Warehouse, Loader2, ArrowRight, Hash, MapPin, SkipForward } from "lucide-react";
import { toast } from "sonner";

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

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
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Warehouse className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Your <span className="text-emerald-400">Location</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-sm">
            Set up your first branch or warehouse. If you operate from one location, call it "Main Branch".
          </p>
        </div>
      </div>

      {/* Benefit callout */}
      <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm text-emerald-100/70 flex gap-3 items-start">
        <Warehouse className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p>Branches let you track inventory and sales separately per location. You can add more branches later from Settings.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormFieldWrapper control={form.control} name="name" label="Branch Name *">
            <Input className="bg-white/5 border-white/10 h-12" placeholder="Main Branch / Downtown Store / Warehouse A" />
          </FormFieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="code" label="Branch Code (optional)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="HQ / DT1 / WH-A" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Address (optional)">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
              <Textarea className="pl-10 bg-white/5 border-white/10 resize-none min-h-[72px]" placeholder="Street address..." />
            </div>
          </FormFieldWrapper>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest transition-all active:scale-95"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Branch <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isSkipping}
              className="h-14 px-5 bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white hover:bg-white/[0.06] rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              {isSkipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
