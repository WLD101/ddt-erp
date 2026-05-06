/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  salesReturnSchema, 
  purchaseReturnSchema 
} from "@/modules/returns/service";
import { 
  createSalesReturnAction, 
  createPurchaseReturnAction 
} from "@/modules/returns/actions";
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
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertCircle } from "lucide-react";

interface ReturnFormProps {
  type: "SALES" | "PURCHASES";
  invoice: any;
  onSuccess?: () => void;
}

export function ReturnForm({ type, invoice, onSuccess }: ReturnFormProps) {
  const schema = type === "SALES" ? salesReturnSchema : purchaseReturnSchema;
  const action = type === "SALES" ? createSalesReturnAction : createPurchaseReturnAction;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      salesInvoiceId: type === "SALES" ? invoice.id : undefined,
      purchaseInvoiceId: type === "PURCHASES" ? invoice.id : undefined,
      reason: "",
      items: invoice.items.map((item: any) => {
        // Calculate max returnable by subtracting already returned across all SR/PRs
        const alreadyReturned = (invoice.returns || []).reduce((sum: number, ret: any) => {
          const retItem = (ret.items || []).find((ri: any) => ri.productId === item.productId);
          return sum + (retItem?.quantity || 0);
        }, 0);

        return {
          productId: item.productId,
          productName: item.product.name,
          maxReturnable: Math.max(0, item.quantity - alreadyReturned),
          quantity: Math.max(0, item.quantity - alreadyReturned) > 0 ? 1 : 0,
          priceAtReturn: type === "SALES" ? item.unitPrice : (item.unitCost || item.unitPrice),
        };
      }),
    },
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: any) => {
    try {
      // Filter out items with 0 quantity
      const submission = {
        ...values,
        items: values.items.filter((i: any) => i.quantity > 0)
      };

      if (submission.items.length === 0) {
        toast.error("Please select at least one item to return");
        return;
      }

      const res = await action(submission);
      if (res.success) {
        toast.success("Return processed successfully");
        onSuccess?.();
      } else {
        toast.error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process return");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-widest text-primary">Return Processing</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are processing a return for <span className="text-white font-bold">{invoice.invoiceNumber}</span>. 
              Stock for the selected items will be reversed in the <span className="text-white font-bold">active branch</span>.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-black uppercase tracking-widest">Return Reason</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Defective items, customer choice" {...field} className="bg-white/5 border-white/10 h-12 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel className="text-[11px] font-black uppercase tracking-widest">Items to Return</FormLabel>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group transition-all hover:bg-white/[0.08]"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-black text-white">{(field as any).productName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Max Returnable: <span className={Number((field as any).maxReturnable) > 0 ? "text-emerald-400" : "text-red-400"}>
                      {(field as any).maxReturnable} units
                    </span>
                  </p>
                </div>

                <div className="w-32">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            placeholder="Qty"
                            className="bg-slate-900 border-white/10 text-center font-bold h-10 rounded-xl focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 h-10 w-10 rounded-xl"
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            disabled={form.formState.isSubmitting}
          >
            <RotateCcw className={`w-5 h-5 ${form.formState.isSubmitting ? 'animate-spin' : ''}`} />
            {form.formState.isSubmitting ? "Processing Transaction..." : "Complete Return"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
