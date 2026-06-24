"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceStatusPill, type VoiceStatusVariant } from "@/components/voice/ui/voice-status-pill";
import { createVoiceLeadAction } from "@/modules/voice/actions";
import { voiceLeadSchema } from "@/modules/voice/schema";

type VoiceLeadValues = z.input<typeof voiceLeadSchema>;

const selectClassName =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type VoiceLeadsManagerProps = {
  leads: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    reasonForCall: string | null;
    status: string;
    notes: string | null;
    source: string;
    appointmentRequested: boolean;
    createdAt: string;
  }>;
};

export function VoiceLeadsManager({ leads }: VoiceLeadsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoiceLeadValues>({
    resolver: zodResolver(voiceLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      reasonForCall: "",
      status: "NEW",
      notes: "",
      appointmentRequested: false,
    },
  });

  const onSubmit = (values: VoiceLeadValues) => {
    startTransition(async () => {
      const result = await createVoiceLeadAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Manual lead added.");
      reset({
        name: "",
        phone: "",
        email: "",
        reasonForCall: "",
        status: "NEW",
        notes: "",
        appointmentRequested: false,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-outline-variant/30 bg-surface text-on-surface shadow-xs">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-on-surface">Manual test lead</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant">
            Use this form to test the receptionist lead workflow before telephony starts writing real caller records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-on-surface-variant">Name</Label>
              <Input {...register("name")} disabled={isPending} className="bg-surface-container-lowest" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-on-surface-variant">Phone</Label>
              <Input {...register("phone")} disabled={isPending} className="bg-surface-container-lowest" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-on-surface-variant">Email</Label>
              <Input {...register("email")} disabled={isPending} className="bg-surface-container-lowest" />
              {errors.email ? <p className="text-xs text-error">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-on-surface-variant">Status</Label>
              <select {...register("status")} disabled={isPending} className={selectClassName}>
                {["NEW", "CONTACTED", "QUALIFIED", "CLOSED"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-on-surface-variant">Reason for call</Label>
              <Input {...register("reasonForCall")} disabled={isPending} placeholder="Appointment inquiry, pricing, support..." className="bg-surface-container-lowest" />
              {errors.reasonForCall ? <p className="text-xs text-error">{errors.reasonForCall.message}</p> : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-on-surface-variant">Notes</Label>
              <Textarea {...register("notes")} disabled={isPending} className="min-h-[110px] bg-surface-container-lowest" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer px-4 py-3 md:col-span-2">
              <div>
                <div className="text-sm font-semibold text-on-surface">Appointment requested</div>
                <div className="text-xs text-on-surface-variant">Use this for businesses that want the receptionist to capture booking intent.</div>
              </div>
              <Controller
                control={control}
                name="appointmentRequested"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                )}
              />
            </div>
            <div className="flex justify-end md:col-span-2 pt-4 border-t border-outline-variant/30">
              <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90 rounded-xl px-6">
                {isPending ? "Saving..." : "Add test lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-outline-variant/30 bg-surface text-on-surface shadow-xs">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-on-surface">Captured leads</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant">
            Real receptionist lead records will appear here later. Zero-state is shown clearly if no data exists yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-5 py-10 text-center text-sm text-on-surface-variant">
              No leads captured yet. AI leads will appear here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-outline-variant/30 bg-surface shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Contact</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Reason</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 bg-transparent">
                    {leads.map((lead) => {
                      const getStatusVariant = (s: string): VoiceStatusVariant => {
                        if (s === "NEW") return "warning";
                        if (s === "CONTACTED") return "online";
                        if (s === "QUALIFIED") return "online";
                        if (s === "CLOSED") return "default";
                        return "default";
                      };

                      return (
                        <tr key={lead.id} className="transition-colors hover:bg-surface-container-lowest">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="font-bold text-on-surface">{lead.name || "Unknown caller"}</div>
                            {lead.appointmentRequested && (
                              <div className="text-[9px] uppercase tracking-wider font-bold text-primary mt-1">Appointment Requested</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-on-surface">{lead.phone || "-"}</div>
                            <div className="text-on-surface-variant text-xs mt-0.5">{lead.email || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant max-w-[200px] truncate" title={lead.reasonForCall || ""}>
                            {lead.reasonForCall || "-"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <VoiceStatusPill variant={getStatusVariant(lead.status)} label={lead.status} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant text-xs">
                            {new Date(lead.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
