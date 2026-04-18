// modules/sales/components/sale-form.tsx
"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salesInvoiceSchema, SalesInvoiceFormValues } from "../schema";
import { createSalesInvoice } from "../actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Calculator, User, Hash, Tag, Package, Quote } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { cn } from "@/lib/utils";
import { usePlanModal } from "@/components/billing/PlanProvider";

interface SaleFormProps {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; unitPrice: number }[];
  initialData?: any;
  onSuccess?: () => void;
}

export function SaleForm({ customers, products, initialData, onSuccess }: SaleFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      invoiceNumber: initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      discount: initialData?.discount || 0,
      notes: initialData?.notes || "",
      items: initialData?.items?.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })) || [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { showLimitModal } = usePlanModal();

  function onSubmit(data: SalesInvoiceFormValues) {
    if (initialData) {
      toast.info("Sales editing is coming soon to the backend. UI finalized.");
      return;
    }
    startTransition(async () => {
      const result = await createSalesInvoice(data);
      if (result.success) {
        toast.success("Sales invoice finalized");
        onSuccess?.();
      } else {
        if (result.error.includes("Plan Limit Reached")) {
          showLimitModal("Sales Invoices", result.error);
        } else {
          toast.error(result.error || "Failed to create invoice");
        }
      }
    });
  }

  const watchedItems = form.watch("items");
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * (item.unitPrice || 0)), 0);
  const discount = Number(form.watch("discount")) || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <FormSection 
          title="Consignment Header" 
          description="Customer assignment and document reference"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="customerId" 
            label="Target Client"
          >
            <Select onValueChange={(val) => form.setValue("customerId", val)} defaultValue={form.getValues("customerId")}>
              <SelectTrigger className="bg-white/5 border-white/10 h-11">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-muted-foreground/60" />
                  <SelectValue placeholder="Identify customer..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="invoiceNumber" 
            label="Invoice Unique ID"
          >
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-10 bg-white/5 border-white/10 h-11 font-mono text-xs uppercase tracking-tighter" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              Inventory Allocation
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
              className="border-primary/20 hover:bg-primary/10 text-primary font-bold transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Line Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-white/5 bg-white/5 overflow-hidden group hover:border-primary/20 transition-colors duration-500">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                  <div className="md:col-span-5">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.productId`} 
                      label="Product Model"
                    >
                      <Select 
                        onValueChange={(val) => {
                          form.setValue(`items.${index}.productId`, val);
                          const product = products.find(p => p.id === val);
                          if (product) {
                            form.setValue(`items.${index}.unitPrice`, product.unitPrice);
                          }
                        }} 
                        defaultValue={form.getValues(`items.${index}.productId`)}
                      >
                        <SelectTrigger className="bg-background/40 border-white/5 h-10">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2 text-muted-foreground/40" />
                            <SelectValue placeholder="Pick Product" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormFieldWrapper>
                  </div>
                  <div className="md:col-span-2">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.quantity`} 
                      label="Quantity"
                    >
                      <Input type="number" className="bg-background/40 border-white/5 h-10 text-center font-bold" />
                    </FormFieldWrapper>
                  </div>
                  <div className="md:col-span-3">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.unitPrice`} 
                      label="Unit Rate ($)"
                    >
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                        <Input type="number" step="0.01" className="pl-9 bg-background/40 border-white/5 h-10" />
                      </div>
                    </FormFieldWrapper>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <FormSection title="Adjustments & Notes" description="Discounts and contractual terms" columns={1}>
            <FormFieldWrapper 
              control={form.control} 
              name="discount" 
              label="Flat Discount ($)"
            >
              <div className="relative">
                <Quote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/60" />
                <Input type="number" step="0.01" className="pl-10 bg-rose-500/5 border-rose-500/10 h-11 font-bold text-rose-500" />
              </div>
            </FormFieldWrapper>

            <FormFieldWrapper 
              control={form.control} 
              name="notes" 
              label="Invoice Terms"
            >
              <Textarea 
                placeholder="Specific delivery terms, payment windows, or thank you notes..." 
                className="bg-white/5 border-white/10 min-h-[100px] resize-none" 
              />
            </FormFieldWrapper>
          </FormSection>

          <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex flex-col justify-center gap-4 text-right shadow-2xl shadow-primary/5">
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Gross Subtotal</p>
               <h4 className="text-xl font-bold text-white/80">${subtotal.toFixed(2)}</h4>
             </div>
             {discount > 0 && (
               <div className="space-y-1">
                 <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.2em]">Institutional Discount</p>
                 <h4 className="text-xl font-bold text-rose-400">-${discount.toFixed(2)}</h4>
               </div>
             )}
             <div className="h-px bg-primary/20 my-2" />
             <div className="space-y-1">
               <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Final Payable Amount (USD)</p>
               <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                 ${total.toFixed(2)}
               </h2>
             </div>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(124,58,237,0.5)] transition-all hover:shadow-[0_25px_50px_-12px_rgba(124,58,237,0.6)] active:scale-95"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : initialData ? "Synchronize Sale" : "Authorize Final Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
