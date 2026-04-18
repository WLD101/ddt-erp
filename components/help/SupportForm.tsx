"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitSupportTicket, supportTicketSchema } from "@/modules/support/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { HELP_CATEGORIES } from "@/lib/help-content";

export function SupportForm() {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<z.infer<typeof supportTicketSchema>>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      category: "",
      subject: "",
      description: "",
    }
  });

  const onSubmit = (data: z.infer<typeof supportTicketSchema>) => {
    startTransition(async () => {
      const result = await submitSupportTicket(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Support ticket submitted. Our team will review it shortly.");
        reset();
      }
    });
  };

  return (
    <Card className="border border-white/5 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl font-black text-white">Contact Support</CardTitle>
        <CardDescription>
          Can't find what you're looking for? Send a direct message to our engineering and support staff.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
             <Label className="text-white/70">Issue Category</Label>
             <Select onValueChange={(val) => setValue("category", val)} disabled={isPending}>
               <SelectTrigger className="bg-black/20 border-white/10 text-white">
                 <SelectValue placeholder="Select a domain..." />
               </SelectTrigger>
               <SelectContent className="bg-slate-900 border-white/10 text-white">
                 {HELP_CATEGORIES.map(category => (
                   <SelectItem key={category.id} value={category.id}>{category.title}</SelectItem>
                 ))}
                 <SelectItem value="other">Other / Bug Report</SelectItem>
               </SelectContent>
             </Select>
             {errors.category && <p className="text-[10px] text-red-400">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Subject Line</Label>
            <Input {...register("subject")} placeholder="Briefly summarize your issue..." className="bg-black/20 border-white/10 text-white" disabled={isPending} />
            {errors.subject && <p className="text-[10px] text-red-400">{errors.subject.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Detailed Description</Label>
            <Textarea {...register("description")} placeholder="Provide specific error messages or replication steps..." className="bg-black/20 border-white/10 text-white min-h-[120px]" disabled={isPending} />
            {errors.description && <p className="text-[10px] text-red-400">{errors.description.message}</p>}
          </div>

          <Button type="submit" disabled={isPending} className="w-full font-bold uppercase tracking-widest text-xs h-11 mt-2">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
