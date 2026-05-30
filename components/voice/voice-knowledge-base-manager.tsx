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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteVoiceKnowledgeBaseItemAction,
  saveVoiceKnowledgeBaseItemAction,
} from "@/modules/voice/actions";
import { voiceKnowledgeBaseItemSchema } from "@/modules/voice/schema";

type KnowledgeItemValues = z.input<typeof voiceKnowledgeBaseItemSchema>;

type VoiceKnowledgeBaseManagerProps = {
  items: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
    isActive: boolean;
  }>;
};

function KnowledgeBaseItemForm({
  initialValues,
}: {
  initialValues: KnowledgeItemValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<KnowledgeItemValues>({
    resolver: zodResolver(voiceKnowledgeBaseItemSchema),
    defaultValues: initialValues,
  });

  const isActive = watch("isActive");

  const onSubmit = (values: KnowledgeItemValues) => {
    startTransition(async () => {
      const result = await saveVoiceKnowledgeBaseItemAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(values.id ? "FAQ item updated." : "FAQ item added.");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!initialValues.id) return;
    startTransition(async () => {
      const result = await deleteVoiceKnowledgeBaseItemAction({ id: initialValues.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("FAQ item deleted.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Question</Label>
          <Input {...register("question")} disabled={isPending} />
          {errors.question && <p className="text-xs text-rose-300">{errors.question.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Category</Label>
          <Input {...register("category")} disabled={isPending} placeholder="Appointments, services, pricing..." />
        </div>
        <div className="flex items-end justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Active</div>
            <div className="text-xs text-slate-400">Inactive entries stay in the database but won’t be used later for answers.</div>
          </div>
          <Switch checked={isActive} onCheckedChange={(checked) => setValue("isActive", Boolean(checked))} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-slate-200">Answer</Label>
          <Textarea {...register("answer")} disabled={isPending} className="min-h-[140px]" />
          {errors.answer && <p className="text-xs text-rose-300">{errors.answer.message}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {initialValues.id ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={onDelete}>
            Delete
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {isPending ? "Saving..." : initialValues.id ? "Save changes" : "Add FAQ item"}
        </Button>
      </div>
    </form>
  );
}

export function VoiceKnowledgeBaseManager({ items }: VoiceKnowledgeBaseManagerProps) {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Knowledge base</CardTitle>
          <CardDescription className="text-slate-300">
            Build the approved FAQ library your receptionist will answer from once telephony and retrieval are connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeBaseItemForm
            initialValues={{
              question: "",
              answer: "",
              category: "",
              isActive: true,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-950/35 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Existing FAQ items</CardTitle>
          <CardDescription className="text-slate-300">
            Zero-state is expected until your business team starts writing receptionist-safe answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300">
              No FAQ items yet. Add your first question and answer above.
            </div>
          ) : (
            items.map((item) => (
              <KnowledgeBaseItemForm
                key={item.id}
                initialValues={{
                  id: item.id,
                  question: item.question,
                  answer: item.answer,
                  category: item.category ?? "",
                  isActive: item.isActive,
                }}
              />
            ))
          )}
        </CardContent>
        <CardFooter className="border-white/10 bg-slate-950/45 text-xs leading-6 text-slate-400">
          These entries are stored separately from the ERP Smart Assistant and only belong to the voice receptionist surface.
        </CardFooter>
      </Card>
    </div>
  );
}
