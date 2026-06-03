"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceBusinessProfileAction } from "@/modules/voice/actions";
import { voiceBusinessProfileSchema, voiceGoalOptions, voiceLanguageOptions, voiceFallbackContactOptions } from "@/modules/voice/schema";

type VoiceBusinessProfileValues = z.input<typeof voiceBusinessProfileSchema>;

const selectClassName =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type VoiceOnboardingFormProps = {
  initialValues: VoiceBusinessProfileValues;
  dashboardHref: string;
};

export function VoiceOnboardingForm({ initialValues, dashboardHref }: VoiceOnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VoiceBusinessProfileValues>({
    resolver: zodResolver(voiceBusinessProfileSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: VoiceBusinessProfileValues) => {
    startTransition(async () => {
      const result = await saveVoiceBusinessProfileAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Voice business setup saved.");
      router.push(dashboardHref);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Business setup</CardTitle>
          <CardDescription className="text-slate-300">
            This information defines how your receptionist introduces the business and what every caller experience is optimized for.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-slate-200">Business name</Label>
            <Input {...register("businessName")} disabled={isPending} />
            {errors.businessName && <p className="text-xs text-rose-300">{errors.businessName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Industry</Label>
            <Input {...register("industry")} disabled={isPending} placeholder="Dental clinic, law firm, real estate, salon..." />
            {errors.industry && <p className="text-xs text-rose-300">{errors.industry.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Website</Label>
            <Input {...register("website")} disabled={isPending} placeholder="https://example.com" />
            {errors.website && <p className="text-xs text-rose-300">{errors.website.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Business phone</Label>
            <Input {...register("businessPhone")} disabled={isPending} placeholder="+92..." />
            {errors.businessPhone && <p className="text-xs text-rose-300">{errors.businessPhone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Preferred receptionist language</Label>
            <select {...register("preferredLanguage")} disabled={isPending} className={selectClassName}>
              {voiceLanguageOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.preferredLanguage && <p className="text-xs text-rose-300">{errors.preferredLanguage.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Main goal</Label>
            <select {...register("mainGoal")} disabled={isPending} className={selectClassName}>
              {voiceGoalOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.mainGoal && <p className="text-xs text-rose-300">{errors.mainGoal.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Opening hours</Label>
            <Textarea
              {...register("openingHours")}
              disabled={isPending}
              placeholder="Mon-Fri 9am-6pm, Sat 10am-2pm, Sun closed"
              className="min-h-[110px]"
            />
            {errors.openingHours && <p className="text-xs text-rose-300">{errors.openingHours.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Fallback contact method</Label>
            <select {...register("fallbackContactMethod")} disabled={isPending} className={selectClassName}>
              {voiceFallbackContactOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.fallbackContactMethod && <p className="text-xs text-rose-300">{errors.fallbackContactMethod.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Greeting message</Label>
            <Textarea
              {...register("greetingMessage")}
              disabled={isPending}
              placeholder="Assalam-o-Alaikum, you've reached Ashraf Cloth House. How can I help you today?"
              className="min-h-[130px]"
            />
            {errors.greetingMessage && <p className="text-xs text-rose-300">{errors.greetingMessage.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="justify-between border-white/10 bg-slate-950/45">
          <p className="max-w-xl text-xs leading-6 text-slate-400">
            This phase stores business setup only. Live telephony, routing rules, and transcripts still come in later phases.
          </p>
          <Button type="submit" disabled={isPending} className="min-w-[220px] bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            {isPending ? "Saving..." : "Save setup and open dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
