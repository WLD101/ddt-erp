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
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

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
      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Manual test lead</CardTitle>
          <CardDescription className="text-slate-300">
            Use this form to test the receptionist lead workflow before telephony starts writing real caller records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-200">Name</Label>
              <Input {...register("name")} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Phone</Label>
              <Input {...register("phone")} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Email</Label>
              <Input {...register("email")} disabled={isPending} />
              {errors.email ? <p className="text-xs text-rose-300">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Status</Label>
              <select {...register("status")} disabled={isPending} className={selectClassName}>
                {["NEW", "CONTACTED", "QUALIFIED", "CLOSED"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-200">Reason for call</Label>
              <Input {...register("reasonForCall")} disabled={isPending} placeholder="Appointment inquiry, pricing, support..." />
              {errors.reasonForCall ? <p className="text-xs text-rose-300">{errors.reasonForCall.message}</p> : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-200">Notes</Label>
              <Textarea {...register("notes")} disabled={isPending} className="min-h-[110px]" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:col-span-2">
              <div>
                <div className="text-sm font-semibold text-white">Appointment requested</div>
                <div className="text-xs text-slate-400">Use this for businesses that want the receptionist to capture booking intent.</div>
              </div>
              <Controller
                control={control}
                name="appointmentRequested"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                )}
              />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                {isPending ? "Saving..." : "Add test lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Captured leads</CardTitle>
          <CardDescription className="text-slate-300">
            Real receptionist lead records will appear here later. Zero-state is shown clearly if no data exists yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/20 px-5 py-10 text-center text-sm text-slate-300">
              No leads captured yet. AI leads will appear here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40 shadow-xl backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Contact</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Reason</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {leads.map((lead) => {
                      const getStatusVariant = (s: string): VoiceStatusVariant => {
                        if (s === "NEW") return "warning";
                        if (s === "CONTACTED") return "online";
                        if (s === "QUALIFIED") return "online";
                        if (s === "CLOSED") return "default";
                        return "default";
                      };

                      return (
                        <tr key={lead.id} className="transition-colors hover:bg-white/5">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="font-bold text-white">{lead.name || "Unknown caller"}</div>
                            {lead.appointmentRequested && (
                              <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 mt-1">Appointment Requested</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-slate-200">{lead.phone || "-"}</div>
                            <div className="text-slate-400 text-xs mt-0.5">{lead.email || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={lead.reasonForCall || ""}>
                            {lead.reasonForCall || "-"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <VoiceStatusPill variant={getStatusVariant(lead.status)} label={lead.status} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-slate-400 text-xs">
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
