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
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300">
              No leads captured yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-slate-950/45 text-slate-300">
                  <tr>
                    {["Name", "Phone", "Email", "Reason", "Status", "Notes", "Created"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.22em]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5 text-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-4 py-3">{lead.name || "Unknown caller"}</td>
                      <td className="px-4 py-3">{lead.phone || "-"}</td>
                      <td className="px-4 py-3">{lead.email || "-"}</td>
                      <td className="px-4 py-3">{lead.reasonForCall || "-"}</td>
                      <td className="px-4 py-3">{lead.status}</td>
                      <td className="px-4 py-3">{lead.notes || (lead.appointmentRequested ? "Appointment requested" : "-")}</td>
                      <td className="px-4 py-3">{new Date(lead.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
