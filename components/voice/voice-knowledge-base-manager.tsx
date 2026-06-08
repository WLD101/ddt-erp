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
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-outline-variant/30 bg-surface-container-lowest p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Question</Label>
          <Input {...register("question")} disabled={isPending} className="border-outline-variant bg-surface-container-low text-on-surface" />
          {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface font-semibold">Category</Label>
          <Input {...register("category")} disabled={isPending} placeholder="Appointments, services, pricing..." className="border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50" />
        </div>
        <div className="flex items-end justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">Active</div>
            <div className="text-xs text-on-surface-variant">Inactive entries stay in the database but won’t be used later for answers.</div>
          </div>
          <Switch checked={isActive} onCheckedChange={(checked) => setValue("isActive", Boolean(checked))} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-on-surface font-semibold">Answer</Label>
          <Textarea {...register("answer")} disabled={isPending} className="min-h-[140px] border-outline-variant bg-surface-container-low text-on-surface" />
          {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {initialValues.id ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={onDelete}>
            Delete
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} className="bg-primary text-on-primary hover:bg-primary/90">
          {isPending ? "Saving..." : initialValues.id ? "Save changes" : "Add FAQ item"}
        </Button>
      </div>
    </form>
  );
}

export function VoiceKnowledgeBaseManager({ items }: VoiceKnowledgeBaseManagerProps) {
  return (
    <div className="space-y-6">
      <Card className="border-outline-variant/30 bg-surface text-on-surface shadow-soft">
        <CardHeader>
          <CardTitle className="text-on-surface">Knowledge base</CardTitle>
          <CardDescription className="text-on-surface-variant">
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

      <Card className="border-outline-variant/30 bg-surface text-on-surface shadow-soft">
        <CardHeader>
          <CardTitle className="text-on-surface">Existing FAQ items</CardTitle>
          <CardDescription className="text-on-surface-variant">
            Zero-state is expected until your business team starts writing receptionist-safe answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-outline-variant/30 bg-surface-container-lowest px-5 py-10 text-center text-sm text-on-surface-variant">
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
        <CardFooter className="border-outline-variant/10 bg-surface-container-low text-xs leading-6 text-on-surface-variant">
          These entries are stored separately from the ERP Smart Assistant and only belong to the voice receptionist surface.
        </CardFooter>
      </Card>
    </div>
  );
}
