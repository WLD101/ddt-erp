/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/modules/finances/service";
import { createAccount } from "@/modules/finances/actions";
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
import { Landmark, Save } from "lucide-react";

export function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CASH" as const,
      accountNumber: "",
      bankName: "",
      initialBalance: 0,
    },
  });

  const accountType = form.watch("type");

  const onSubmit = async (values: any) => {
    try {
      await createAccount(values);
      toast.success("Account initialized successfully");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize account");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Account Identifier</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Petty Cash HQ or Corporate Bank A" {...field} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="CASH">Cash Pool</SelectItem>
                    <SelectItem value="BANK">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Opening Balance</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                    className="bg-white/5 border-white/10 h-12 rounded-xl font-bold" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {accountType === "BANK" && (
          <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Banking Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 h-10 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 h-10 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="pt-6">
          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={form.formState.isSubmitting}
          >
            <Save className={`w-5 h-5 ${form.formState.isSubmitting ? 'animate-spin' : ''}`} />
            {form.formState.isSubmitting ? "Initializing Pool..." : "Establish Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
