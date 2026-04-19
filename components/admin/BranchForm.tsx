"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBranch } from "@/modules/admin/branch-actions";
import { branchSchema } from "@/modules/admin/branch-schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { toast } from "sonner";
import { Building2, Info } from "lucide-react";

export function BranchForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      isMain: false,
    },
  });

  const onSubmit = async (values: any) => {
    try {
      await createBranch(values);
      toast.success("Branch established successfully");
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to establish branch");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight">Branch Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Downtown Warehouse" {...field} className="bg-white/5 border-white/10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight">Branch Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. WH-01" {...field} className="bg-white/5 border-white/10 uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold tracking-tight">Physical Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Industrial Way..." {...field} className="bg-white/5 border-white/10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
          <FormField
            control={form.control}
            name="isMain"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-5 h-5 border-2 border-primary data-[state=checked]:bg-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-bold flex items-center gap-2">
                    Set as Organization Headquarters
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </FormLabel>
                  <FormDescription className="text-[11px] text-muted-foreground mt-1">
                    Marking this as 'Main' will make it the default site for new members and consolidated reporting.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-start gap-3 bg-slate-800/30 rounded-xl p-4 border border-white/5">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Establishing a new branch automatically initializes a dedicated inventory pool. 
            All transactions and stock levels created within this branch will be isolated from other locations.
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Establishing operational site..." : "Establish Branch"}
        </Button>
      </form>
    </Form>
  );
}
