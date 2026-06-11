"use client";

import { useTransition, useState } from "react";
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
  importVoiceMenuAction,
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
  badge,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="border-outline-variant/30 bg-surface text-on-surface shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between border-b border-outline-variant/10 pb-4 mb-4">
        <div>
          <CardTitle className="text-lg font-black text-on-surface tracking-tight">{title}</CardTitle>
          <CardDescription className="text-xs text-on-surface-variant mt-1">{description}</CardDescription>
        </div>
        {badge}
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
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface cursor-pointer hover:bg-surface-container-low transition-all"
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

function MenuUploadCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clearExisting, setClearExisting] = useState(false);
  const [menuText, setMenuText] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setMenuText(text);
        toast.success(`Loaded ${file.name} successfully.`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!menuText.trim()) {
      toast.error("Please enter menu text or upload a file.");
      return;
    }

    startTransition(async () => {
      const result = await importVoiceMenuAction({ menuText, clearExisting });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Successfully imported ${result.data.count} service items using ${result.data.method}!`);
      setMenuText("");
      router.refresh();
    });
  };

  return (
    <Card className="border-outline-variant/30 bg-surface text-on-surface shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-black text-on-surface">Auto-generate Service Catalog</CardTitle>
        <CardDescription className="text-xs text-on-surface-variant">
          Upload your menu, rate list, or charges chart (text or CSV file), or paste the details directly. The AI will automatically summarize it and generate structured service items for your voice agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Upload menu / rate list file</Label>
          <Input 
            type="file" 
            accept=".txt,.csv,.md,.json" 
            onChange={handleFileUpload} 
            disabled={isPending}
            className="cursor-pointer border-outline-variant bg-surface-container-low text-on-surface"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Or paste menu text here</Label>
          <Textarea
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            placeholder={`Example:
Consultation Fee: PKR 1,500 (available weekdays)
Deluxe Facial - PKR 3,500 - 45 min deep cleansing session
Special Tea: Rs. 150`}
            disabled={isPending}
            className="min-h-[150px] border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface cursor-pointer">
          <Checkbox
            checked={clearExisting}
            onCheckedChange={(checked) => setClearExisting(Boolean(checked))}
            disabled={isPending}
          />
          <span>Replace existing service catalog items</span>
        </label>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-outline-variant/10 pt-4">
        <Button 
          onClick={handleImport} 
          disabled={isPending}
          className="bg-primary text-on-primary hover:bg-primary/95"
        >
          {isPending ? "Generating..." : "Summarize & Generate Services"}
        </Button>
      </CardFooter>
    </Card>
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
          <Label className="text-on-surface font-semibold">Business name</Label>
          <Input {...register("businessName")} disabled={isPending} />
          {errors.businessName && <p className="text-xs text-rose-300">{errors.businessName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Industry</Label>
          <Input {...register("industry")} disabled={isPending} />
          {errors.industry && <p className="text-xs text-rose-300">{errors.industry.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Location / city</Label>
          <Input {...register("locationCity")} disabled={isPending} />
          {errors.locationCity && <p className="text-xs text-rose-300">{errors.locationCity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Website</Label>
          <Input {...register("website")} disabled={isPending} placeholder="https://example.com" />
          {errors.website && <p className="text-xs text-rose-300">{errors.website.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Primary language</Label>
          <select {...register("primaryLanguage")} disabled={isPending} className={selectClassName}>
            {voiceTrainingLanguageOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Tone</Label>
          <select {...register("tone")} disabled={isPending} className={selectClassName}>
            {voiceTrainingToneOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">Supported languages</Label>
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
          <Label className="text-on-surface font-semibold">Short business description</Label>
          <Textarea {...register("shortDescription")} disabled={isPending} className="min-h-[100px]" />
          {errors.shortDescription && <p className="text-xs text-rose-300">{errors.shortDescription.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Business phone</Label>
          <Input {...register("businessPhone")} disabled={isPending} />
          {errors.businessPhone && <p className="text-xs text-rose-300">{errors.businessPhone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Fallback contact method</Label>
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
          <Label className="text-on-surface font-semibold">Main goal</Label>
          <Input {...register("mainGoal")} disabled={isPending} placeholder="Answer FAQs, capture leads, route calls..." />
          {errors.mainGoal && <p className="text-xs text-rose-300">{errors.mainGoal.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Opening hours</Label>
          <Textarea {...register("openingHours")} disabled={isPending} className="min-h-[100px]" />
          {errors.openingHours && <p className="text-xs text-rose-300">{errors.openingHours.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Greeting message</Label>
          <Textarea {...register("greetingMessage")} disabled={isPending} className="min-h-[100px]" />
          {errors.greetingMessage && <p className="text-xs text-rose-300">{errors.greetingMessage.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Closing message</Label>
          <Textarea {...register("closingMessage")} disabled={isPending} className="min-h-[100px]" />
          {errors.closingMessage && <p className="text-xs text-rose-300">{errors.closingMessage.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Holiday or closed days placeholder</Label>
          <Textarea {...register("holidayClosures")} disabled={isPending} className="min-h-[80px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
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
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-outline-variant/30 bg-surface-container-lowest p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Service or menu item</Label>
          <Input {...register("name")} disabled={isPending} />
          {errors.name && <p className="text-xs text-rose-300">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Category</Label>
          <Input {...register("category")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Description</Label>
          <Textarea {...register("description")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Price placeholder</Label>
          <Input {...register("pricePlaceholder")} disabled={isPending} placeholder="PKR 2,500 / Consultation fee on request" />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Availability</Label>
          <Input {...register("availability")} disabled={isPending} placeholder="Weekdays only / Seasonal / In stock" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Notes</Label>
          <Textarea {...register("notes")} disabled={isPending} className="min-h-[80px]" />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">Modes and visibility</Label>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { field: "takeawayAvailable", checked: takeawayAvailable, label: "Takeaway available" },
              { field: "deliveryAvailable", checked: deliveryAvailable, label: "Delivery available" },
              { field: "dineInAvailable", checked: dineInAvailable, label: "Dine-in available" },
              { field: "isActive", checked: isActive, label: "Active item" },
            ].map(({ field, checked, label }) => (
              <label
                key={field}
                className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface"
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
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
          {isPending ? "Saving..." : initialValues.id ? "Save service item" : "Add service item"}
        </Button>
      </div>
    </form>
  );
}

function ServiceCatalogSection({ items }: { items: VoiceTrainingWorkspace["serviceItems"] }) {
  return (
    <div className="space-y-6">
      <MenuUploadCard />
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
            <div className="rounded-[24px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-5 py-10 text-center text-sm text-on-surface-variant">
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
        <label className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface md:col-span-2">
          <span>Accept booking or appointment requests</span>
          <Switch checked={acceptsBookings} onCheckedChange={(next) => setValue("acceptsBookings", Boolean(next))} />
        </label>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Booking type</Label>
          <select {...register("bookingType")} disabled={isPending} className={selectClassName}>
            {voiceBookingTypeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Booking mode</Label>
          <select {...register("bookingMode")} disabled={isPending} className={selectClassName}>
            {voiceBookingModeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
          {errors.bookingMode && <p className="text-xs text-rose-300">{errors.bookingMode.message}</p>}
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">Required fields</Label>
          <Controller
            control={control}
            name="requiredFields"
            render={({ field }) => (
              <CheckboxGrid options={voiceBookingRequiredFieldOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Max party size</Label>
          <Input type="number" {...register("maxPartySize")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Booking duration (minutes)</Label>
          <Input type="number" {...register("bookingDurationMinutes")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Advance booking limit (hours)</Label>
          <Input type="number" {...register("advanceBookingLimitHours")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Confirmation message</Label>
          <Textarea {...register("confirmationMessage")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Fallback message</Label>
          <Textarea {...register("fallbackMessage")} disabled={isPending} className="min-h-[90px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
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
        <label className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface md:col-span-2">
          <span>Accept order requests</span>
          <Switch checked={acceptsOrderRequests} onCheckedChange={(next) => setValue("acceptsOrderRequests", Boolean(next))} />
        </label>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Order mode</Label>
          <select {...register("orderMode")} disabled={isPending} className={selectClassName}>
            {voiceOrderModeOptions.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
          {errors.orderMode && <p className="text-xs text-rose-300">{errors.orderMode.message}</p>}
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">Order types</Label>
          <Controller
            control={control}
            name="orderTypes"
            render={({ field }) => (
              <CheckboxGrid options={voiceOrderTypeOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">Required fields</Label>
          <Controller
            control={control}
            name="requiredFields"
            render={({ field }) => (
              <CheckboxGrid options={voiceOrderRequiredFieldOptions} value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Allergy disclaimer</Label>
          <Textarea {...register("allergyDisclaimer")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Order confirmation wording</Label>
          <Textarea {...register("confirmationWording")} disabled={isPending} className="min-h-[90px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
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
          <Label className="text-on-surface font-semibold">Fallback phone</Label>
          <Input {...register("fallbackPhone")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Fallback email</Label>
          <Input {...register("fallbackEmail")} disabled={isPending} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Staff notification placeholder</Label>
          <Textarea {...register("staffNotificationPlaceholder")} disabled={isPending} className="min-h-[90px]" />
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-on-surface font-semibold">When to hand off</Label>
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
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
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
          <Label className="text-on-surface font-semibold">Allowed AI actions</Label>
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
          <Label className="text-on-surface font-semibold">Blocked AI actions</Label>
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
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
          {isPending ? "Saving..." : "Save action policy"}
        </Button>
      </div>
    </form>
  );
}

function PromptPreviewCard({
  promptPreview,
  syncAvailable,
  voiceAgentId,
  assistantId,
  assistantName,
  businessName,
  firstMessage,
  internalName,
  phoneTrackingName,
  phoneNumberId,
  webhookUrl,
  webhookSecretConfigured,
  lastPromptSyncedAt,
  callingEnabled,
  isPromptStale,
  validationErrors,
}: {
  promptPreview: string;
  syncAvailable: boolean;
  voiceAgentId: string | null;
  assistantId: string | null;
  assistantName: string;
  businessName: string;
  firstMessage: string;
  internalName: string | null;
  phoneTrackingName: string | null;
  phoneNumberId: string | null;
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
  lastPromptSyncedAt: string | null;
  callingEnabled: boolean;
  isPromptStale: boolean;
  validationErrors: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(promptPreview);
    toast.success("Prompt copied.");
  };

  const syncPrompt = () => {
    startTransition(async () => {
      if (!voiceAgentId) {
        toast.error("No tenant-scoped voice agent is available for this prompt.");
        return;
      }
      const result = await syncVoiceTrainingPromptAction({ voiceAgentId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Prompt updated successfully.");
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
          {validationErrors.length > 0 ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <div className="font-semibold">Prompt sync is blocked until these issues are fixed:</div>
              <ul className="mt-2 list-disc pl-5">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {isPromptStale ? (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Prompt is stale. Training data changed after the last sync, so this assistant should be synced again.
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={copyPrompt}>
              Copy prompt
            </Button>
            <Button
              type="button"
              onClick={syncPrompt}
              disabled={!syncAvailable || isPending || validationErrors.length > 0}
              className="bg-primary text-on-primary hover:bg-primary/90"
            >
              {isPending ? "Syncing..." : "Sync assistant"}
            </Button>
          </div>
          {!syncAvailable ? (
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mt-2">
              Sync becomes available only when voice integration keys and a business-specific assistant ID are configured.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Engine mapping"
        description="Read-only mapping status for this tenant's assistant. Public webhook routes must resolve through these tenant-safe identifiers."
      >
        <div className="space-y-4 text-sm text-on-surface">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Caller-facing business name</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{businessName}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Generated assistant name</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{assistantName}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Internal key</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{internalName || "Not generated"}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Phone tracking label</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{phoneTrackingName || "Not generated yet"}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Generated first message</div>
            <div className="mt-2 text-on-surface font-semibold">{firstMessage}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Assistant ID</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{assistantId || "Not connected"}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Phone number ID</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{phoneNumberId || "Not connected"}</div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Server URL</div>
            <div className="mt-2 break-all text-on-surface font-semibold">{webhookUrl || "Not configured"}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Webhook secret</div>
              <div className="mt-2 text-on-surface font-semibold">{webhookSecretConfigured ? "Configured" : "Missing"}</div>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Calling enabled</div>
              <div className="mt-2 text-on-surface font-semibold">{callingEnabled ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Last synced at</div>
            <div className="mt-2 text-on-surface font-semibold">{lastPromptSyncedAt ? new Date(lastPromptSyncedAt).toLocaleString() : "Never synced"}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function VoiceTrainingCenter({ workspace }: VoiceTrainingCenterProps) {
  const runtime = workspace.runtime;
  const mapping = runtime.vapiMapping;
  const syncAvailable = Boolean(runtime.agent.id && mapping.webhookUrl);

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
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Weekly opening hours</div>
            <p className="mt-3 whitespace-pre-wrap text-on-surface font-semibold">{runtime.businessIdentity.openingHours || "Not configured yet."}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">After-hours behavior</div>
            <p className="mt-3 text-on-surface font-semibold">
              {workspace.receptionistSettings?.afterHoursBehavior
                ? workspace.receptionistSettings.afterHoursBehavior.replaceAll("_", " ")
                : voiceAfterHoursBehaviorOptions[0].replaceAll("_", " ")}
            </p>
            <p className="mt-3 text-on-surface-variant">
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
        voiceAgentId={runtime.agent.id}
        assistantId={mapping.assistantId}
        assistantName={workspace.assistantName}
        businessName={runtime.businessIdentity.businessName}
        firstMessage={workspace.firstMessage}
        internalName={runtime.agent.internalName}
        phoneTrackingName={workspace.phoneTrackingName}
        phoneNumberId={mapping.phoneNumberId}
        webhookUrl={mapping.webhookUrl}
        webhookSecretConfigured={mapping.webhookSecretConfigured}
        lastPromptSyncedAt={mapping.lastPromptSyncedAt ? new Date(mapping.lastPromptSyncedAt).toISOString() : null}
        callingEnabled={mapping.callingEnabled}
        isPromptStale={workspace.syncState.isPromptStale}
        validationErrors={workspace.promptValidation.errors}
      />
    </div>
  );
}
