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
import { createVoiceCallLogAction } from "@/modules/voice/actions";
import { voiceCallLogSchema } from "@/modules/voice/schema";

type VoiceCallLogValues = z.input<typeof voiceCallLogSchema>;

const selectClassName =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type VoiceCallLogsManagerProps = {
  logs: Array<{
    id: string;
    callerNumber: string;
    callStatus: string;
    callDirection: string;
    summary: string | null;
    transcriptPlaceholder: string | null;
    transcript: string | null;
    recordingUrl: string | null;
    endedReason: string | null;
    providerCallId: string | null;
    durationSeconds: number | null;
    appointmentRequested: boolean;
    createdAt: string;
  }>;
  allowDevTools: boolean;
};

export function VoiceCallLogsManager({ logs, allowDevTools }: VoiceCallLogsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoiceCallLogValues>({
    resolver: zodResolver(voiceCallLogSchema),
    defaultValues: {
      callerNumber: "",
      callStatus: "MISSED",
      callDirection: "INBOUND",
      summary: "",
      transcriptPlaceholder: "",
      durationSeconds: 0,
      appointmentRequested: false,
    },
  });

  const onSubmit = (values: VoiceCallLogValues) => {
    startTransition(async () => {
      const result = await createVoiceCallLogAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Development call log created.");
      reset({
        callerNumber: "",
        callStatus: "MISSED",
        callDirection: "INBOUND",
        summary: "",
        transcriptPlaceholder: "",
        durationSeconds: 0,
        appointmentRequested: false,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {allowDevTools ? (
        <Card className="border-white/10 bg-slate-950/35 text-slate-50">
          <CardHeader>
            <CardTitle className="text-white">Development-only test call log</CardTitle>
            <CardDescription className="text-slate-300">
              This helper is available outside production only. It never runs in production and exists so we can test the dashboard before telephony arrives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Caller number</Label>
                <Input {...register("callerNumber")} disabled={isPending} />
                {errors.callerNumber ? <p className="text-xs text-rose-300">{errors.callerNumber.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Duration (seconds)</Label>
                <Input {...register("durationSeconds")} type="number" disabled={isPending} min={0} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Call status</Label>
                <select {...register("callStatus")} disabled={isPending} className={selectClassName}>
                  {["MISSED", "COMPLETED", "VOICEMAIL", "ABANDONED"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Direction</Label>
                <select {...register("callDirection")} disabled={isPending} className={selectClassName}>
                  {["INBOUND", "OUTBOUND"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200">Summary</Label>
                <Textarea {...register("summary")} disabled={isPending} className="min-h-[100px]" />
                {errors.summary ? <p className="text-xs text-rose-300">{errors.summary.message}</p> : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200">Transcript placeholder</Label>
                <Textarea {...register("transcriptPlaceholder")} disabled={isPending} className="min-h-[110px]" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-white">Appointment requested</div>
                  <div className="text-xs text-slate-400">Marks the call as booking-related for dashboard metrics.</div>
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
                  {isPending ? "Saving..." : "Create test call log"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Call logs</CardTitle>
          <CardDescription className="text-slate-300">
            Real telephony events are not fully connected yet. Until then, this page shows zero-state or development-only test entries clearly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/20 px-5 py-10 text-center text-sm text-slate-300">
              No call logs yet. AI conversations will appear here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40 shadow-xl backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Caller</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Direction</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Duration</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Summary</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {logs.map((log) => {
                      const getStatusVariant = (s: string): VoiceStatusVariant => {
                        if (s === "COMPLETED") return "online";
                        if (s === "MISSED" || s === "FAILED") return "error";
                        if (s === "IN_PROGRESS") return "warning";
                        return "default";
                      };

                      return (
                        <tr key={log.id} className="transition-colors hover:bg-white/5">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-white">{log.callerNumber}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <VoiceStatusPill variant={getStatusVariant(log.callStatus)} label={log.callStatus} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                              {log.callDirection}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                            {typeof log.durationSeconds === "number" ? `${Math.floor(log.durationSeconds / 60)}m ${log.durationSeconds % 60}s` : "-"}
                          </td>
                          <td className="px-6 py-4 text-slate-300 max-w-xs truncate" title={log.summary || log.transcriptPlaceholder || ""}>
                            {log.summary || log.transcriptPlaceholder || "Pending live telephony"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-slate-400 text-xs">
                            {new Date(log.createdAt).toLocaleString()}
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
