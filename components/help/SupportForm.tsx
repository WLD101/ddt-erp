"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportTicket } from "@/modules/support/actions";
import { SUPPORT_REASONS, supportTicketSchema } from "@/modules/support/schema";

type SupportTicketFormValues = z.input<typeof supportTicketSchema>;

export function SupportForm() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      priority: "NORMAL",
      reason: "",
      subject: "",
      description: "",
      sourcePage: pathname,
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const selectedReason = watch("reason");
  const selectedPriority = watch("priority");

  function onSubmit(data: SupportTicketFormValues) {
    startTransition(async () => {
      const result = await submitSupportTicket({
        ...data,
        sourcePage: data.sourcePage || pathname,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Support ticket submitted. Our team can see your tenant and issue details.");
      reset({
        priority: "NORMAL",
        reason: "",
        subject: "",
        description: "",
        sourcePage: pathname,
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    });
  }

  return (
    <Card className="rounded-[30px] border border-outline-variant/30 bg-surface shadow-soft">
      <CardHeader>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">WhatsQuery Support</p>
        <CardTitle className="text-2xl font-black tracking-tight text-on-surface">Report an issue</CardTitle>
        <CardDescription className="text-sm leading-6 text-on-surface-variant">
          Choose the closest reason and describe what happened. Your tenant, user, and page context are attached automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Reason</Label>
              <Select value={selectedReason || ""} onValueChange={(value) => setValue("reason", value || "", { shouldValidate: true })} disabled={isPending}>
                <SelectTrigger className="h-11 rounded-2xl bg-surface-container-low">
                  <SelectValue placeholder="Select issue reason" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reason && <p className="text-xs font-semibold text-error">{errors.reason.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Priority</Label>
              <Select value={selectedPriority || "NORMAL"} onValueChange={(value) => setValue("priority", value as SupportTicketFormValues["priority"])} disabled={isPending}>
                <SelectTrigger className="h-11 rounded-2xl bg-surface-container-low">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-xs font-semibold text-error">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Subject</Label>
            <Input
              {...register("subject")}
              placeholder="Briefly summarize the issue"
              className="h-11 rounded-2xl bg-surface-container-low"
              disabled={isPending}
            />
            {errors.subject && <p className="text-xs font-semibold text-error">{errors.subject.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Details</Label>
            <Textarea
              {...register("description")}
              placeholder="Include steps, screenshots context, expected result, or error messages."
              className="min-h-[150px] rounded-2xl bg-surface-container-low"
              disabled={isPending}
            />
            {errors.description && <p className="text-xs font-semibold text-error">{errors.description.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Contact name</Label>
              <Input {...register("contactName")} className="h-11 rounded-2xl bg-surface-container-low" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Email</Label>
              <Input {...register("contactEmail")} className="h-11 rounded-2xl bg-surface-container-low" disabled={isPending} />
              {errors.contactEmail && <p className="text-xs font-semibold text-error">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Phone</Label>
              <Input {...register("contactPhone")} className="h-11 rounded-2xl bg-surface-container-low" disabled={isPending} />
            </div>
          </div>

          <input type="hidden" {...register("sourcePage")} value={pathname} />

          <Button type="submit" disabled={isPending} className="h-12 w-full rounded-2xl text-[11px] font-black uppercase tracking-[0.18em]">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
