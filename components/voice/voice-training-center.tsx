"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { VoiceKnowledgeBaseManager } from "@/components/voice/voice-knowledge-base-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteVoiceServiceItemAction,
  saveVoiceActionPolicyAction,
  saveVoiceBookingRulesAction,
  saveVoiceHandoffRulesAction,
  saveVoiceOrderRulesAction,
  saveVoiceServiceItemAction,
  saveVoiceTrainingProfileAction,
  syncVoiceTrainingPromptAction,
} from "@/modules/voice/actions";
import type { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";
import {
  voiceActionPolicySchema,
  voiceAfterHoursBehaviorOptions,
  voiceAllowedActionOptions,
  voiceBlockedActionOptions,
  voiceBookingModeOptions,
  voiceBookingRequiredFieldOptions,
  voiceBookingRulesSchema,
  voiceBookingTypeOptions,
  voiceHandoffRulesSchema,
  voiceHandoffTriggerOptions,
  voiceOrderModeOptions,
  voiceOrderRequiredFieldOptions,
  voiceOrderRulesSchema,
  voiceOrderTypeOptions,
  voiceServiceItemSchema,
  voiceTrainingLanguageOptions,
  voiceTrainingProfileSchema,
  voiceTrainingToneOptions,
} from "@/modules/voice/training/schema";
import { voiceFallbackContactOptions } from "@/modules/voice/schema";

type VoiceTrainingWorkspace = Awaited<ReturnType<typeof getVoiceTrainingWorkspace>>;
type VoiceTrainingCenterProps = {
  workspace: VoiceTrainingWorkspace;
};

const selectClassName =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type TrainingProfileValues = z.output<typeof voiceTrainingProfileSchema>;
type ServiceItemValues = z.output<typeof voiceServiceItemSchema>;
type BookingRulesValues = z.output<typeof voiceBookingRulesSchema>;
type OrderRulesValues = z.output<typeof voiceOrderRulesSchema>;
type HandoffRulesValues = z.output<typeof voiceHandoffRulesSchema>;
type ActionPolicyValues = z.output<typeof voiceActionPolicySchema>;

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-slate-950/35 text-slate-50">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-300">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CheckboxGrid({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => {
        const checked = value.includes(option);
        return (
          <label
            key={option}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(nextChecked) => {
                onChange(nextChecked ? [...value, option] : value.filter((item) => item !== option));
              }}
            />
            <span>{labels?.[option] || option.replaceAll("_", " ")}</span>
          </label>
        );
      })}
    </div>
  );
}

function TrainingIdentityForm({ initialValues }: { initialValues: TrainingProfileValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState: { errors } } = useForm<TrainingProfileValues>({
    resolver: zodResolver(voiceTrainingProfileSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: TrainingProfileValues) => {
    startTransition(async () => {
      const result = await saveVoiceTrainingProfileAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Business training identity updated.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-200">Business name</Label>
          <Input {...register("businessName")} disabled={isPending} />
          {errors.businessName && <p className="text-xs text-rose-300">{errors.businessName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Industry</Label>
          <Input {...register("industry")} disabled={isPending} />
          {errors.industry && <p className="text-xs text-rose-300">{errors.industry.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Location / city</Label>
          <Input {...register("locationCity")} disabled={isPending} />
          {errors.locationCity && <p className="text-xs text-rose-300">{errors.locationCity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Website</Label>
          <Input {...register("website")} disabled={isPending} placeholder="https://example.com" />
          {errors.website && <p className="text-xs text-rose-300">{errors.website.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Primary language</Label>
          <select {...register("primaryLanguage")} disabled={isPending} className={selectClassName}>
            {voiceTrainingLanguageOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Tone</Label>
          <select {...register("tone")} disabled={isPending} className={selectClassName}>
            {voiceTrainingToneOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">Supported languages</Label>
          <Controller
            control={control}
            name="supportedLanguages"
            render={({ field }) => (
              <CheckboxGrid options={voiceTrainingLanguageOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          {errors.supportedLanguages && <p className="text-xs text-rose-300">{errors.supportedLanguages.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Short business description</Label>
          <Textarea {...register("shortDescription")} disabled={isPending} className="min-h-[100px]" />
          {errors.shortDescription && <p className="text-xs text-rose-300">{errors.shortDescription.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Business phone</Label>
          <Input {...register("businessPhone")} disabled={isPending} />
          {errors.businessPhone && <p className="text-xs text-rose-300">{errors.businessPhone.message}</p>}
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
        <div className="space-y-2">
          <Label className="text-slate-200">Main goal</Label>
          <Input {...register("mainGoal")} disabled={isPending} placeholder="Answer FAQs, capture leads, route calls..." />
          {errors.mainGoal && <p className="text-xs text-rose-300">{errors.mainGoal.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Opening hours</Label>
          <Textarea {...register("openingHours")} disabled={isPending} className="min-h-[100px]" />
          {errors.openingHours && <p className="text-xs text-rose-300">{errors.openingHours.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Greeting message</Label>
          <Textarea {...register("greetingMessage")} disabled={isPending} className="min-h-[100px]" />
          {errors.greetingMessage && <p className="text-xs text-rose-300">{errors.greetingMessage.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Closing message</Label>
          <Textarea {...register("closingMessage")} disabled={isPending} className="min-h-[100px]" />
          {errors.closingMessage && <p className="text-xs text-rose-300">{errors.closingMessage.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Holiday or closed days placeholder</Label>
          <Textarea {...register("holidayClosures")} disabled={isPending} className="min-h-[80px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : "Save business identity"}
        </Button>
      </div>
    </form>
  );
}

function ServiceItemForm({ initialValues }: { initialValues: ServiceItemValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceItemValues>({
    resolver: zodResolver(voiceServiceItemSchema) as never,
    defaultValues: initialValues,
  });

  const isActive = watch("isActive");
  const takeawayAvailable = watch("takeawayAvailable");
  const deliveryAvailable = watch("deliveryAvailable");
  const dineInAvailable = watch("dineInAvailable");

  const onSubmit = (values: ServiceItemValues) => {
    startTransition(async () => {
      const result = await saveVoiceServiceItemAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "Service item updated." : "Service item added.");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!initialValues.id) return;
    startTransition(async () => {
      const result = await deleteVoiceServiceItemAction({ id: initialValues.id! });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Service item deleted.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-200">Service or menu item</Label>
          <Input {...register("name")} disabled={isPending} />
          {errors.name && <p className="text-xs text-rose-300">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Category</Label>
          <Input {...register("category")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Description</Label>
          <Textarea {...register("description")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Price placeholder</Label>
          <Input {...register("pricePlaceholder")} disabled={isPending} placeholder="PKR 2,500 / Consultation fee on request" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Availability</Label>
          <Input {...register("availability")} disabled={isPending} placeholder="Weekdays only / Seasonal / In stock" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Notes</Label>
          <Textarea {...register("notes")} disabled={isPending} className="min-h-[80px]" />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">Modes and visibility</Label>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { field: "takeawayAvailable", checked: takeawayAvailable, label: "Takeaway available" },
              { field: "deliveryAvailable", checked: deliveryAvailable, label: "Delivery available" },
              { field: "dineInAvailable", checked: dineInAvailable, label: "Dine-in available" },
              { field: "isActive", checked: isActive, label: "Active item" },
            ].map(({ field, checked, label }) => (
              <label
                key={field}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200"
              >
                <span>{label}</span>
                <Switch checked={Boolean(checked)} onCheckedChange={(next) => setValue(field as keyof ServiceItemValues, Boolean(next))} />
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {initialValues.id ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={onDelete}>
            Delete
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : initialValues.id ? "Save service item" : "Add service item"}
        </Button>
      </div>
    </form>
  );
}

function ServiceCatalogSection({ items }: { items: VoiceTrainingWorkspace["serviceItems"] }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Services, menu, and offerings"
        description="Define what this business offers so the receptionist can describe real services and collect the right request details."
      >
        <ServiceItemForm
          initialValues={{
            name: "",
            category: "",
            description: "",
            pricePlaceholder: "",
            availability: "",
            notes: "",
            takeawayAvailable: false,
            deliveryAvailable: false,
            dineInAvailable: false,
            isActive: true,
          }}
        />
      </SectionCard>

      <SectionCard
        title="Current service catalog"
        description="These items are tenant-scoped and only used by this business's receptionist prompt."
      >
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300">
              No service or menu items yet. Add your first item above.
            </div>
          ) : (
            items.map((item) => (
              <ServiceItemForm
                key={item.id}
                initialValues={{
                  id: item.id,
                  name: item.name,
                  category: item.category ?? "",
                  description: item.description ?? "",
                  pricePlaceholder: item.pricePlaceholder ?? "",
                  availability: item.availability ?? "",
                  notes: item.notes ?? "",
                  takeawayAvailable: item.takeawayAvailable,
                  deliveryAvailable: item.deliveryAvailable,
                  dineInAvailable: item.dineInAvailable,
                  isActive: item.isActive,
                }}
              />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function BookingRulesForm({ initialValues }: { initialValues: BookingRulesValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, control, setValue, watch, handleSubmit, formState: { errors } } = useForm<BookingRulesValues>({
    resolver: zodResolver(voiceBookingRulesSchema) as never,
    defaultValues: initialValues,
  });
  const acceptsBookings = watch("acceptsBookings");

  const onSubmit = (values: BookingRulesValues) => {
    startTransition(async () => {
      const result = await saveVoiceBookingRulesAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Booking rules saved.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200 md:col-span-2">
          <span>Accept booking or appointment requests</span>
          <Switch checked={acceptsBookings} onCheckedChange={(next) => setValue("acceptsBookings", Boolean(next))} />
        </label>
        <div className="space-y-2">
          <Label className="text-slate-200">Booking type</Label>
          <select {...register("bookingType")} disabled={isPending} className={selectClassName}>
            {voiceBookingTypeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Booking mode</Label>
          <select {...register("bookingMode")} disabled={isPending} className={selectClassName}>
            {voiceBookingModeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
          {errors.bookingMode && <p className="text-xs text-rose-300">{errors.bookingMode.message}</p>}
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">Required fields</Label>
          <Controller
            control={control}
            name="requiredFields"
            render={({ field }) => (
              <CheckboxGrid options={voiceBookingRequiredFieldOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Max party size</Label>
          <Input type="number" {...register("maxPartySize")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Booking duration (minutes)</Label>
          <Input type="number" {...register("bookingDurationMinutes")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Advance booking limit (hours)</Label>
          <Input type="number" {...register("advanceBookingLimitHours")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Confirmation message</Label>
          <Textarea {...register("confirmationMessage")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Fallback message</Label>
          <Textarea {...register("fallbackMessage")} disabled={isPending} className="min-h-[90px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : "Save booking rules"}
        </Button>
      </div>
    </form>
  );
}

function OrderRulesForm({ initialValues }: { initialValues: OrderRulesValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, control, setValue, watch, handleSubmit, formState: { errors } } = useForm<OrderRulesValues>({
    resolver: zodResolver(voiceOrderRulesSchema) as never,
    defaultValues: initialValues,
  });
  const acceptsOrderRequests = watch("acceptsOrderRequests");

  const onSubmit = (values: OrderRulesValues) => {
    startTransition(async () => {
      const result = await saveVoiceOrderRulesAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Order rules saved.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200 md:col-span-2">
          <span>Accept order requests</span>
          <Switch checked={acceptsOrderRequests} onCheckedChange={(next) => setValue("acceptsOrderRequests", Boolean(next))} />
        </label>
        <div className="space-y-2">
          <Label className="text-slate-200">Order mode</Label>
          <select {...register("orderMode")} disabled={isPending} className={selectClassName}>
            {voiceOrderModeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
          {errors.orderMode && <p className="text-xs text-rose-300">{errors.orderMode.message}</p>}
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">Order types</Label>
          <Controller
            control={control}
            name="orderTypes"
            render={({ field }) => (
              <CheckboxGrid options={voiceOrderTypeOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">Required fields</Label>
          <Controller
            control={control}
            name="requiredFields"
            render={({ field }) => (
              <CheckboxGrid options={voiceOrderRequiredFieldOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Allergy disclaimer</Label>
          <Textarea {...register("allergyDisclaimer")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Order confirmation wording</Label>
          <Textarea {...register("confirmationWording")} disabled={isPending} className="min-h-[90px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : "Save order rules"}
        </Button>
      </div>
    </form>
  );
}

function HandoffRulesForm({ initialValues }: { initialValues: HandoffRulesValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState: { errors } } = useForm<HandoffRulesValues>({
    resolver: zodResolver(voiceHandoffRulesSchema) as never,
    defaultValues: initialValues,
  });

  const onSubmit = (values: HandoffRulesValues) => {
    startTransition(async () => {
      const result = await saveVoiceHandoffRulesAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Handoff rules saved.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-200">Fallback phone</Label>
          <Input {...register("fallbackPhone")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Fallback email</Label>
          <Input {...register("fallbackEmail")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Staff notification placeholder</Label>
          <Textarea {...register("staffNotificationPlaceholder")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-slate-200">When to hand off</Label>
          <Controller
            control={control}
            name="handoffTriggers"
            render={({ field }) => (
              <CheckboxGrid options={voiceHandoffTriggerOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          {errors.handoffTriggers && <p className="text-xs text-rose-300">{errors.handoffTriggers.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : "Save handoff rules"}
        </Button>
      </div>
    </form>
  );
}

function ActionPolicyForm({ initialValues }: { initialValues: ActionPolicyValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, formState: { errors } } = useForm<ActionPolicyValues>({
    resolver: zodResolver(voiceActionPolicySchema) as never,
    defaultValues: initialValues,
  });

  const onSubmit = (values: ActionPolicyValues) => {
    startTransition(async () => {
      const result = await saveVoiceActionPolicyAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("AI action policy saved.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-slate-200">Allowed AI actions</Label>
          <Controller
            control={control}
            name="allowedActions"
            render={({ field }) => (
              <CheckboxGrid options={voiceAllowedActionOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          {errors.allowedActions && <p className="text-xs text-rose-300">{errors.allowedActions.message}</p>}
        </div>
        <div className="space-y-3">
          <Label className="text-slate-200">Blocked AI actions</Label>
          <Controller
            control={control}
            name="blockedActions"
            render={({ field }) => (
              <CheckboxGrid options={voiceBlockedActionOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          {errors.blockedActions && <p className="text-xs text-rose-300">{errors.blockedActions.message}</p>}
        </div>
      </div>
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        ERP writes and backend auto-confirmation remain disabled by default. This training center can only save safe request data until dedicated backend flows are implemented.
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : "Save action policy"}
        </Button>
      </div>
    </form>
  );
}

function PromptPreviewCard({
  promptPreview,
  syncAvailable,
  assistantId,
  phoneNumberId,
  webhookUrl,
  webhookSecretConfigured,
  lastPromptSyncedAt,
  callingEnabled,
}: {
  promptPreview: string;
  syncAvailable: boolean;
  assistantId: string | null;
  phoneNumberId: string | null;
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
  lastPromptSyncedAt: string | null;
  callingEnabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(promptPreview);
    toast.success("Prompt copied.");
  };

  const syncPrompt = () => {
    startTransition(async () => {
      const result = await syncVoiceTrainingPromptAction({});
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Prompt synced to Vapi assistant.");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
      <SectionCard
        title="Prompt preview"
        description="Generate a live business-specific receptionist prompt using identity, FAQs, business rules, and allowed actions."
      >
        <div className="space-y-4">
          <Textarea value={promptPreview} readOnly className="min-h-[420px] font-mono text-xs leading-6" />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={copyPrompt}>
              Copy prompt
            </Button>
            <Button
              type="button"
              onClick={syncPrompt}
              disabled={!syncAvailable || isPending}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {isPending ? "Syncing..." : "Sync to Vapi assistant"}
            </Button>
          </div>
          {!syncAvailable ? (
            <p className="text-xs text-slate-400">
              Sync becomes available only when Vapi keys and a business-specific Vapi assistant ID are configured.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Vapi mapping"
        description="Read-only mapping status for this tenant's assistant. Public webhook routes must resolve through these tenant-safe identifiers."
      >
        <div className="space-y-4 text-sm text-slate-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Vapi assistant ID</div>
            <div className="mt-2 break-all text-white">{assistantId || "Not connected"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Vapi phone number ID</div>
            <div className="mt-2 break-all text-white">{phoneNumberId || "Not connected"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Server URL</div>
            <div className="mt-2 break-all text-white">{webhookUrl || "Not configured"}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Webhook secret</div>
              <div className="mt-2 text-white">{webhookSecretConfigured ? "Configured" : "Missing"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Calling enabled</div>
              <div className="mt-2 text-white">{callingEnabled ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Last synced at</div>
            <div className="mt-2 text-white">{lastPromptSyncedAt ? new Date(lastPromptSyncedAt).toLocaleString() : "Never synced"}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function VoiceTrainingCenter({ workspace }: VoiceTrainingCenterProps) {
  const runtime = workspace.runtime;
  const mapping = runtime.vapiMapping;
  const syncAvailable = Boolean(mapping.assistantId);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Business identity"
        description="Define how this business should sound, what languages it supports, and what greeting/closing it should use."
      >
        <TrainingIdentityForm
          initialValues={{
            businessName: runtime.businessIdentity.businessName,
            industry: runtime.businessIdentity.industry,
            locationCity: runtime.businessIdentity.locationCity || "",
            shortDescription: runtime.businessIdentity.shortDescription || "",
            primaryLanguage: runtime.businessIdentity.primaryLanguage as TrainingProfileValues["primaryLanguage"],
            supportedLanguages: runtime.businessIdentity.supportedLanguages as TrainingProfileValues["supportedLanguages"],
            tone: runtime.businessIdentity.tone as TrainingProfileValues["tone"],
            greetingMessage: runtime.businessIdentity.greetingMessage || "",
            closingMessage: runtime.businessIdentity.closingMessage || "",
            website: runtime.businessIdentity.website || "",
            businessPhone: runtime.businessIdentity.businessPhone || "",
            openingHours: runtime.businessIdentity.openingHours || "",
            mainGoal: runtime.businessIdentity.mainGoal || "",
            fallbackContactMethod: 
              (runtime.businessIdentity.fallbackContactMethod as "WHATSAPP" | "SMS" | "EMAIL" | "HUMAN_TRANSFER" | "NONE" | undefined) ?? 
              "WHATSAPP",
            holidayClosures: runtime.businessIdentity.holidayClosures || "",
          }}
        />
      </SectionCard>

      <SectionCard
        title="Business hours"
        description="Use the same tenant-safe hours that webhook tools and prompt generation will read back to callers."
      >
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Weekly opening hours</div>
            <p className="mt-3 whitespace-pre-wrap text-slate-100">{runtime.businessIdentity.openingHours || "Not configured yet."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">After-hours behavior</div>
            <p className="mt-3 text-slate-100">
              {workspace.receptionistSettings?.afterHoursBehavior
                ? workspace.receptionistSettings.afterHoursBehavior.replaceAll("_", " ")
                : voiceAfterHoursBehaviorOptions[0].replaceAll("_", " ")}
            </p>
            <p className="mt-3 text-slate-300">
              Holiday placeholder: {runtime.businessIdentity.holidayClosures || "No holiday rule configured yet."}
            </p>
          </div>
        </div>
      </SectionCard>

      <ServiceCatalogSection items={workspace.serviceItems} />

      <VoiceKnowledgeBaseManager
        items={workspace.knowledgeBaseItems.map((item) => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          category: item.category,
          isActive: item.isActive,
        }))}
      />

      <SectionCard
        title="Booking rules"
        description="Control whether the receptionist can take booking requests and exactly what it must collect before saving a request."
      >
        <BookingRulesForm
          initialValues={{
            acceptsBookings: runtime.bookingRules.acceptsBookings,
            bookingType: runtime.bookingRules.bookingType as BookingRulesValues["bookingType"],
            bookingMode: runtime.bookingRules.bookingMode as BookingRulesValues["bookingMode"],
            requiredFields: runtime.bookingRules.requiredFields as BookingRulesValues["requiredFields"],
            maxPartySize: runtime.bookingRules.maxPartySize ?? undefined,
            bookingDurationMinutes: runtime.bookingRules.bookingDurationMinutes ?? undefined,
            advanceBookingLimitHours: runtime.bookingRules.advanceBookingLimitHours ?? undefined,
            confirmationMessage: runtime.bookingRules.confirmationMessage || "",
            fallbackMessage: runtime.bookingRules.fallbackMessage || "",
          }}
        />
      </SectionCard>

      <SectionCard
        title="Order request rules"
        description="Define how the receptionist handles takeaway, delivery, or dine-in order requests without creating ERP records."
      >
        <OrderRulesForm
          initialValues={{
            acceptsOrderRequests: runtime.orderRules.acceptsOrderRequests,
            orderMode: runtime.orderRules.orderMode as OrderRulesValues["orderMode"],
            orderTypes: runtime.orderRules.orderTypes as OrderRulesValues["orderTypes"],
            requiredFields: runtime.orderRules.requiredFields as OrderRulesValues["requiredFields"],
            allergyDisclaimer: runtime.orderRules.allergyDisclaimer || "",
            confirmationWording: runtime.orderRules.confirmationWording || "",
          }}
        />
      </SectionCard>

      <SectionCard
        title="Human handoff"
        description="Decide when the AI should stop and collect a callback or escalation request for a human team member."
      >
        <HandoffRulesForm
          initialValues={{
            fallbackPhone: runtime.handoffRules.fallbackPhone || "",
            fallbackEmail: runtime.handoffRules.fallbackEmail || "",
            staffNotificationPlaceholder: runtime.handoffRules.staffNotificationPlaceholder || "",
            handoffTriggers: runtime.handoffRules.handoffTriggers as HandoffRulesValues["handoffTriggers"],
          }}
        />
      </SectionCard>

      <SectionCard
        title="Allowed and blocked AI actions"
        description="Keep the receptionist useful but contained. Unsafe financial or legal actions stay blocked by policy."
      >
        <ActionPolicyForm
          initialValues={{
            allowedActions: runtime.actionPolicy.allowedActions as ActionPolicyValues["allowedActions"],
            blockedActions: runtime.actionPolicy.blockedActions as ActionPolicyValues["blockedActions"],
            erpWritesEnabled: false,
            backendAutoConfirmationEnabled: false,
          }}
        />
      </SectionCard>

      <PromptPreviewCard
        promptPreview={workspace.promptPreview}
        syncAvailable={syncAvailable}
        assistantId={mapping.assistantId}
        phoneNumberId={mapping.phoneNumberId}
        webhookUrl={mapping.webhookUrl}
        webhookSecretConfigured={mapping.webhookSecretConfigured}
        lastPromptSyncedAt={mapping.lastPromptSyncedAt ? new Date(mapping.lastPromptSyncedAt).toISOString() : null}
        callingEnabled={mapping.callingEnabled}
      />
    </div>
  );
}
