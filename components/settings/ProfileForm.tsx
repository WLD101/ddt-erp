"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateOrganizationProfile, updateProfileSchema } from "@/modules/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type FormValues = z.infer<typeof updateProfileSchema>;

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
      <Card className="border-white/5 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-black text-white">Business Profile</CardTitle>
          <CardDescription>
            This information appears on your invoices, quotations, and official documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-white/70">Company Name</Label>
            <Input {...register("name")} className="bg-black/20 border-white/10 text-white" disabled={isPending} />
            {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Workspace Slug (Read Only)</Label>
            <Input value={initialData.slug} readOnly disabled className="bg-black/40 border-white/5 text-white/50 cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Contact Email</Label>
            <Input {...register("email")} type="email" placeholder="billing@company.com" className="bg-black/20 border-white/10 text-white" disabled={isPending} />
            {errors.email && <p className="text-[10px] text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Phone Number</Label>
            <Input {...register("phone")} placeholder="+1 (555) 000-0000" className="bg-black/20 border-white/10 text-white" disabled={isPending} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-white/70">Physical Address</Label>
            <Input {...register("address")} placeholder="123 Commerce St, Suite 400..." className="bg-black/20 border-white/10 text-white" disabled={isPending} />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PREFERENCES */}
      <Card className="border-white/5 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-black text-white">Localization & Settings</CardTitle>
          <CardDescription>
            Configure default formatting for financial records and taxes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-white/70">System Currency</Label>
            <Input {...register("currency")} placeholder="USD, EUR, GBP" className="bg-black/20 border-white/10 text-white uppercase" disabled={isPending} />
            {errors.currency && <p className="text-[10px] text-red-400">{errors.currency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Tax/VAT Label</Label>
            <Input {...register("taxLabel")} placeholder="e.g. VAT, GST, Sales Tax" className="bg-black/20 border-white/10 text-white" disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Country</Label>
            <Input {...register("country")} placeholder="United States" className="bg-black/20 border-white/10 text-white" disabled={isPending} />
          </div>
        </CardContent>
        <CardFooter className="bg-white/[0.02] border-t border-white/5 pt-6 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Changes applied here will reflect globally across all branches.</p>
          <Button type="submit" disabled={isPending} className="font-bold uppercase tracking-widest text-xs px-6">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
    </form>
  );
}
