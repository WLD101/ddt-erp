"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  DollarSign,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveBusinessProfile } from "@/modules/onboarding/actions";
import { profileSchema } from "@/modules/onboarding/service";

const CURRENCIES = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "PKR", label: "PKR - Pakistani Rupee" },
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "INR", label: "INR - Indian Rupee" },
];

interface Props {
  stepId: string;
  onComplete: (id: string) => void;
  onSkip?: (id: string) => void;
}

type ProfileStepValues = z.input<typeof profileSchema>;

export function ProfileStep({ stepId, onComplete }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileStepValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { currency: "USD", timezone: "UTC" },
  });

  const onSubmit = (data: ProfileStepValues) => {
    startTransition(async () => {
      const result = await saveBusinessProfile(profileSchema.parse(data));
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
          <Building2 className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
            Business <span className="text-blue-500">Profile</span>
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            This information appears on your invoices, quotations, and reports.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormFieldWrapper control={form.control} name="name" label="Business Name *">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
              <Input className="h-12 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="e.g. Nexus Trading Co." />
            </div>
          </FormFieldWrapper>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="phone" label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="+1 555 0100" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="email" label="Business Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="billing@yourbiz.com" />
              </div>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="address" label="Business Address">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant/50" />
              <Textarea
                className="min-h-[72px] resize-none border-outline-variant/30 bg-surface-container-low pl-10"
                placeholder="123 Commerce Street, Business District..."
              />
            </div>
          </FormFieldWrapper>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormFieldWrapper control={form.control} name="country" label="Country">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/50" />
                <Input className="h-11 border-outline-variant/30 bg-surface-container-low pl-10" placeholder="United States" />
              </div>
            </FormFieldWrapper>
            <FormFieldWrapper control={form.control} name="currency" label="Base Currency">
              <Select onValueChange={(v) => form.setValue("currency", v ?? "USD")} defaultValue="USD">
                <SelectTrigger className="h-11 border-outline-variant/30 bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-on-surface-variant/50" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-outline-variant/30 bg-surface">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={form.control} name="taxLabel" label="Tax / VAT Label (optional)">
            <Input className="h-11 border-outline-variant/30 bg-surface-container-low" placeholder='e.g. "VAT", "GST", "Sales Tax"' />
          </FormFieldWrapper>

          <Button
            type="submit"
            disabled={isPending}
            className="h-14 w-full rounded-2xl bg-primary font-black uppercase tracking-widest text-on-surface shadow-[0_10px_30px_rgba(124,58,237,0.22)] transition-all active:scale-95 hover:bg-primary/90"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Save Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

