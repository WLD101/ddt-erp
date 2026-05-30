"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceReceptionistSettingsAction } from "@/modules/voice/actions";
import {
  voiceAfterHoursOptions,
  voiceLanguageOptions,
  voiceLeadCaptureFields,
  voiceReceptionistSettingsSchema,
} from "@/modules/voice/schema";

type VoiceReceptionistSettingsValues = z.input<typeof voiceReceptionistSettingsSchema>;

const selectClassName =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type VoiceSettingsFormProps = {
  initialValues: VoiceReceptionistSettingsValues;
};

const leadCaptureFieldLabels: Record<(typeof voiceLeadCaptureFields)[number], string> = {
  name: "Caller name",
  phone: "Phone number",
  email: "Email address",
  reason: "Reason for call",
  appointment_time: "Preferred appointment time",
};

export function VoiceSettingsForm({ initialValues }: VoiceSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VoiceReceptionistSettingsValues>({
    resolver: zodResolver(voiceReceptionistSettingsSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: VoiceReceptionistSettingsValues) => {
    startTransition(async () => {
      const result = await saveVoiceReceptionistSettingsAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Receptionist settings updated.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Receptionist behavior</CardTitle>
          <CardDescription className="text-slate-300">
            Configure how the receptionist greets callers, what it collects, and what happens outside office hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-slate-200">Receptionist name</Label>
            <Input {...register("receptionistName")} disabled={isPending} />
            {errors.receptionistName && <p className="text-xs text-rose-300">{errors.receptionistName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Language mode</Label>
            <select {...register("languageMode")} disabled={isPending} className={selectClassName}>
              {voiceLanguageOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.languageMode && <p className="text-xs text-rose-300">{errors.languageMode.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Greeting message</Label>
            <Textarea {...register("greetingMessage")} disabled={isPending} className="min-h-[110px]" />
            {errors.greetingMessage && <p className="text-xs text-rose-300">{errors.greetingMessage.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Fallback message</Label>
            <Textarea {...register("fallbackMessage")} disabled={isPending} className="min-h-[110px]" />
            {errors.fallbackMessage && <p className="text-xs text-rose-300">{errors.fallbackMessage.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Business hours</Label>
            <Textarea {...register("businessHours")} disabled={isPending} className="min-h-[110px]" />
            {errors.businessHours && <p className="text-xs text-rose-300">{errors.businessHours.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">After-hours behavior</Label>
            <select {...register("afterHoursBehavior")} disabled={isPending} className={selectClassName}>
              {voiceAfterHoursOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.afterHoursBehavior && <p className="text-xs text-rose-300">{errors.afterHoursBehavior.message}</p>}
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className="text-slate-200">Lead capture fields</Label>
            <Controller
              control={control}
              name="leadCaptureFields"
              render={({ field }) => (
                <div className="grid gap-3 md:grid-cols-2">
                  {voiceLeadCaptureFields.map((option) => {
                    const checked = field.value?.includes(option) ?? false;
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            const current = field.value ?? [];
                            field.onChange(
                              nextChecked
                                ? [...current, option]
                                : current.filter((value) => value !== option),
                            );
                          }}
                        />
                        <span>{leadCaptureFieldLabels[option]}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.leadCaptureFields && <p className="text-xs text-rose-300">{errors.leadCaptureFields.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="justify-end border-white/10 bg-slate-950/45">
          <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            {isPending ? "Saving..." : "Save receptionist settings"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
