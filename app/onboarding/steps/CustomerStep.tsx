"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, MapPin, Phone, SkipForward, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { onboardingCustomerSchema } from "@/modules/onboarding/service";
import { saveOnboardingCustomer, skipOnboardingStep } from "@/modules/onboarding/actions";

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function CustomerStep({ stepId, onComplete, onSkip }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSkipping, startSkip] = useTransition();

  const form = useForm<z.infer<typeof onboardingCustomerSchema>>({
    resolver: zodResolver(onboardingCustomerSchema),
    defaultValues: {},
  });

  const onSubmit = (data: z.infer<typeof onboardingCustomerSchema>) => {
    startTransition(async () => {
      const result = await saveOnboardingCustomer(data);
      if (result.success) onComplete(stepId);
      else toast.error(result.error || "Failed to add customer");
    });
  };

  const handleSkip = () => {
    startSkip(async () => {
      await skipOnboardingStep("customer");
      onSkip?.(stepId);
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <Users className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            First <span className="text-violet-500">Customer</span>
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Add your first customer to issue invoices and quotations. You can import more later.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormFieldWrapper control={form.control} name="name" label="Customer Name *">
            <Input className="h-12 border-outline-variant/30 bg-surface-container-low" placeholder="e.g. Acme Retail Ltd." />
          </FormFieldWrapper>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="phone" label="Phone (optional)">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="+1 555 0200" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="email" label="Email (optional)">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="customer@email.com" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Address (optional)">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant/50" />
              <Textarea className="min-h-[72px] resize-none border-outline-variant/30 bg-surface-container-low pl-10" placeholder="Customer billing address..." />
            </div>
          </FormFieldWrapper>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-14 flex-1 rounded-2xl bg-violet-600 font-black uppercase tracking-widest text-on-surface transition-all active:scale-95 hover:bg-violet-700"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Save Customer <ArrowRight className="ml-2 h-4 w-4" /></>}
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

