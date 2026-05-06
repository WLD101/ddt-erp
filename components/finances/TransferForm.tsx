/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema } from "@/modules/finances/service";
import { executeTransfer } from "@/modules/finances/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRightLeft, SendHorizontal } from "lucide-react";

interface TransferFormProps {
  accounts: any[];
  onSuccess?: () => void;
}

export function TransferForm({ accounts, onSuccess }: TransferFormProps) {
  const form = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      reason: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      await executeTransfer(values);
      toast.success("Fund transfer completed successfully");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Transfer failed");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl">
                      <SelectValue placeholder="From..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-bold text-xs">{acc.name}</span>
                          <span className="text-[9px] text-primary/70">${acc.currentBalance.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-6">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
          </div>

          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl">
                      <SelectValue placeholder="To..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id} disabled={acc.id === form.watch("fromAccountId")}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-bold text-xs">{acc.name}</span>
                          <span className="text-[9px] text-muted-foreground">${acc.currentBalance.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-primary">Transfer Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                  className="bg-white/5 border-white/20 h-16 rounded-3xl text-3xl font-black text-center text-white focus:border-primary transition-all" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Memo</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bank deposit or petty cash replenishment" {...field} className="bg-white/5 border-white/10 h-12 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl shadow-emerald-900/40 flex items-center gap-3 transition-all active:scale-95"
            disabled={form.formState.isSubmitting}
          >
            <SendHorizontal className={`w-5 h-5 ${form.formState.isSubmitting ? 'animate-pulse' : ''}`} />
            {form.formState.isSubmitting ? "Executing Transaction..." : "Complete Transfer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
