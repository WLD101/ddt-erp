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
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1 text-sm text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

type VoiceCallLogsManagerProps = {
  logs: Array<{
    id: string;
    callerNumber: string;
    callStatus: string;
    callDirection: string;
    summary: string | null;
    transcriptPlaceholder: string | null;
    transcript: string | null;
    recordingHref: string | null;
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
        <Card className="rounded-[28px] border-outline-variant/30 bg-surface text-on-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-on-surface">Development-only test call log</CardTitle>
            <CardDescription className="text-sm text-on-surface-variant">
              This helper is available outside production only. It never runs in production and exists so we can test the dashboard before telephony arrives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant">Caller number</Label>
                <Input {...register("callerNumber")} disabled={isPending} className="bg-surface-container-lowest" />
                {errors.callerNumber ? <p className="text-xs text-error">{errors.callerNumber.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant">Duration (seconds)</Label>
                <Input {...register("durationSeconds")} type="number" disabled={isPending} min={0} className="bg-surface-container-lowest" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant">Call status</Label>
                <select {...register("callStatus")} disabled={isPending} className={selectClassName}>
                  {["MISSED", "COMPLETED", "VOICEMAIL", "ABANDONED"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant">Direction</Label>
                <select {...register("callDirection")} disabled={isPending} className={selectClassName}>
                  {["INBOUND", "OUTBOUND"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold text-on-surface-variant">Summary</Label>
                <Textarea {...register("summary")} disabled={isPending} className="min-h-[100px] bg-surface-container-lowest" />
                {errors.summary ? <p className="text-xs text-error">{errors.summary.message}</p> : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold text-on-surface-variant">Transcript placeholder</Label>
                <Textarea {...register("transcriptPlaceholder")} disabled={isPending} className="min-h-[110px] bg-surface-container-lowest" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer px-4 py-3 md:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-on-surface">Appointment requested</div>
                  <div className="text-xs text-on-surface-variant">Marks the call as booking-related for dashboard metrics.</div>
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
                  {isPending ? "Saving..." : "Create test call log"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[28px] border-outline-variant/30 bg-surface text-on-surface shadow-xs">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-on-surface">Call logs</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant">
            Real telephony events are not fully connected yet. Until then, this page shows zero-state or development-only test entries clearly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-5 py-10 text-center text-sm text-on-surface-variant">
              No call logs yet. AI conversations will appear here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-outline-variant/30 bg-surface shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Caller</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Direction</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Duration</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Summary</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Recording</th>
                      <th className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 bg-transparent">
                    {logs.map((log) => {
                      const getStatusVariant = (s: string): VoiceStatusVariant => {
                        if (s === "COMPLETED") return "online";
                        if (s === "MISSED" || s === "FAILED") return "error";
                        if (s === "IN_PROGRESS") return "warning";
                        return "default";
                      };

                      return (
                        <tr key={log.id} className="transition-colors hover:bg-surface-container-lowest">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-on-surface">{log.callerNumber}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <VoiceStatusPill variant={getStatusVariant(log.callStatus)} label={log.callStatus} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="text-[11px] font-bold tracking-widest uppercase text-on-surface-variant">
                              {log.callDirection}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant">
                            {typeof log.durationSeconds === "number" ? `${Math.floor(log.durationSeconds / 60)}m ${log.durationSeconds % 60}s` : "-"}
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate" title={log.summary || log.transcriptPlaceholder || ""}>
                            {log.summary || log.transcriptPlaceholder || "Pending live telephony"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {log.recordingHref ? (
                              <a
                                href={log.recordingHref}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary hover:bg-primary/15"
                              >
                                Hear Call
                              </a>
                            ) : (
                              <span className="text-xs text-on-surface-variant">Not available</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant text-xs">
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
