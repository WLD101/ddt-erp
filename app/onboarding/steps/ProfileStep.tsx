"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/modules/onboarding/service";
import { saveBusinessProfile } from "@/modules/onboarding/actions";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, ArrowRight, Globe, DollarSign, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "INR", label: "INR — Indian Rupee" },
];

interface Props { stepId: string; onComplete: (id: string) => void; onSkip?: (id: string) => void; }

export function ProfileStep({ stepId, onComplete }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { currency: "USD", timezone: "UTC" },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    startTransition(async () => {
      const result = await saveBusinessProfile(data);
      if (result.success) {
        onComplete(stepId);
      } else {
        toast.error(result.error || "Failed to save profile");
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Business <span className="text-blue-400">Profile</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            This information appears on your invoices, quotations, and reports.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Name */}
          <FormFieldWrapper control={form.control} name="name" label="Business Name *">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input className="pl-10 bg-white/5 border-white/10 h-12 focused:border-primary/50" placeholder="e.g. Nexus Trading Co." />
            </div>
          </FormFieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="phone" label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="+1 555 0100" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="email" label="Business Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="billing@yourbiz.com" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Business Address">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
              <Textarea className="pl-10 bg-white/5 border-white/10 resize-none min-h-[72px]" placeholder="123 Commerce Street, Business District..." />
            </div>
          </FormFieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormFieldWrapper control={form.control} name="country" label="Country">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11" placeholder="United States" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="currency" label="Base Currency">
              <Select onValueChange={v => form.setValue("currency", v)} defaultValue="USD">
                <SelectTrigger className="bg-white/5 border-white/10 h-11">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground/50" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="taxLabel" label="Tax / VAT Label (optional)">
            <Input className="bg-white/5 border-white/10 h-11" placeholder='e.g. "VAT", "GST", "Sales Tax"' />
          </FormFieldWrapper>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-13 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-all active:scale-95"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save Profile <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </form>
      </Form>
    </div>
  );
}
