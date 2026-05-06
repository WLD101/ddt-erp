"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateOrganizationProfile } from "@/modules/settings/actions";
import { updateProfileSchema } from "@/modules/settings/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FormValues = z.input<typeof updateProfileSchema>;

export function ProfileForm({ 
  initialData 
}: { 
  initialData: Partial<FormValues> & { slug: string }
}) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
      address: initialData.address || "",
      country: initialData.country || "",
      currency: initialData.currency || "USD",
      timezone: initialData.timezone || "UTC",
      taxLabel: initialData.taxLabel || "",
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateOrganizationProfile(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile and preferences updated successfully!");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* SECTION 1: BUSINESS PROFILE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Business Identity</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant font-medium">
            Official information for invoices, quotations, and manifests.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Company Name</Label>
            <Input {...register("name")} disabled={isPending} />
            {errors.name && <p className="text-[10px] text-error font-medium">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">System Handle</Label>
            <Input value={initialData.slug} readOnly disabled className="bg-surface-container-low/50 font-mono text-[11px]" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Primary Email</Label>
            <Input {...register("email")} type="email" placeholder="operations@company.com" disabled={isPending} />
            {errors.email && <p className="text-[10px] text-error font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Support Phone</Label>
            <Input {...register("phone")} placeholder="+1 555 0100" disabled={isPending} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">HQ Address</Label>
            <Input {...register("address")} placeholder="Full physical location..." disabled={isPending} />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PREFERENCES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Localization & Policy</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant font-medium">
            Default formatting for financial records and statutory reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Base Currency</Label>
            <Input {...register("currency")} placeholder="PKR, USD, etc." className="uppercase font-black" disabled={isPending} />
            {errors.currency && <p className="text-[10px] text-error font-medium">{errors.currency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tax Identification Label</Label>
            <Input {...register("taxLabel")} placeholder="e.g. NTN, GST, VAT" disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Jurisdiction</Label>
            <Input {...register("country")} placeholder="United States" disabled={isPending} />
          </div>
        </CardContent>
        <CardFooter className="bg-surface-container-low/20 border-t border-outline-variant/30 py-6 flex justify-between items-center">
          <p className="text-[11px] text-on-surface-variant font-medium italic">Changes propagate globally across all linked branches.</p>
          <Button type="submit" disabled={isPending} className="px-8 h-10 font-black uppercase tracking-[0.1em] text-xs">
            {isPending ? (
               <span className="material-symbols-outlined animate-spin text-[18px] mr-2">progress_activity</span>
            ) : (
               <span className="material-symbols-outlined text-[18px] mr-2">verified_user</span>
            )}
            Authorize Update
          </Button>
        </CardFooter>
      </Card>
      
    </form>
  );
}
