"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingCustomerSchema } from "@/modules/onboarding/service";
import { saveOnboardingCustomer, skipOnboardingStep } from "@/modules/onboarding/actions";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Users, Loader2, ArrowRight, SkipForward, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

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
        <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            First <span className="text-violet-400">Customer</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first customer to issue invoices and quotations. You can import more later.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormFieldWrapper control={form.control} name="name" label="Customer Name *">
            <Input className="bg-white/5 border-white/10 h-12" placeholder="e.g. Acme Retail Ltd." />
          </FormFieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="phone" label="Phone (optional)">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="+1 555 0200" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="email" label="Email (optional)">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="customer@email.com" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Address (optional)">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
              <Textarea className="pl-10 bg-white/5 border-white/10 resize-none min-h-[72px]" placeholder="Customer billing address..." />
            </div>
          </FormFieldWrapper>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-14 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest transition-all active:scale-95"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save Customer <ArrowRight className="ml-2 w-4 h-4" /></>}
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
