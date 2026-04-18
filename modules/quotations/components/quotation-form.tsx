"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quotationSchema, QuotationInput } from "../service";
import { createQuotationAction } from "../actions";
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
import { Plus, Trash2, Loader2, User, Hash, Tag, Package, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { addDays } from "date-fns";
import { useRouter } from "next/navigation";

interface QuotationFormProps {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; unitPrice: number }[];
  initialData?: any;
}

export function QuotationForm({ customers, products, initialData }: QuotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      quotationNumber: initialData?.quotationNumber || `QT-${Date.now().toString().slice(-6)}`,
      date: initialData?.date || new Date(),
      expiryDate: initialData?.expiryDate || addDays(new Date(), 14), // 14 days default
      discount: initialData?.discount || 0,
      notes: initialData?.notes || "This quotation is valid for 14 days from the date of issue. Prices are inclusive of general applicable taxes.",
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

  function onSubmit(data: QuotationInput) {
    startTransition(async () => {
      const result = await createQuotationAction(data);
      if (result.success) {
        toast.success("Commercial proposal generated");
        router.push("/sales/quotes");
      } else {
        toast.error(result.error || "Failed to generate quotation");
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
          title="Proposal Header" 
          description="Identify the client and set proposal validity"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="customerId" 
            label="Target Client"
          >
            <Select onValueChange={(val) => form.setValue("customerId", val)} defaultValue={form.getValues("customerId")}>
              <SelectTrigger className="bg-white/5 border-white/10 h-11 transition-all focus:border-indigo-500/50">
                <div className="flex items-center text-xs">
                  <User className="w-4 h-4 mr-2 text-indigo-400/60" />
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

          <div className="grid grid-cols-2 gap-4">
            <FormFieldWrapper 
              control={form.control} 
              name="quotationNumber" 
              label="Quotation ID"
            >
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                <Input className="pl-10 bg-white/5 border-white/10 h-11 font-mono text-[10px] uppercase tracking-tighter" />
              </div>
            </FormFieldWrapper>

            <FormFieldWrapper 
              control={form.control} 
              name="expiryDate" 
              label="Expiry Date"
            >
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                <Input 
                  type="date" 
                  className="pl-10 bg-white/5 border-white/10 h-11 text-xs" 
                  value={form.watch("expiryDate") instanceof Date ? form.watch("expiryDate").toISOString().split('T')[0] : ""}
                  onChange={(e) => form.setValue("expiryDate", new Date(e.target.value))}
                />
              </div>
            </FormFieldWrapper>
          </div>
        </FormSection>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
              Line Items & Estimates
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
              className="border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-400 font-bold transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-white/5 bg-white/5 overflow-hidden group hover:border-indigo-500/20 transition-colors duration-500">
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
                        <SelectTrigger className="bg-background/40 border-white/5 h-10 text-xs text-white/70">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2 text-indigo-400/40" />
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
                      label="Qty"
                    >
                      <Input type="number" className="bg-background/40 border-white/5 h-10 text-center font-bold text-white/80" />
                    </FormFieldWrapper>
                  </div>
                  <div className="md:col-span-3">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.unitPrice`} 
                      label="Unit Rate ($)"
                    >
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400/40" />
                        <Input type="number" step="0.01" className="pl-9 bg-background/40 border-white/5 h-10 text-white/80" />
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
          <FormSection title="Closing & Notes" description="Discounts and valid terminology" columns={1}>
            <FormFieldWrapper 
              control={form.control} 
              name="discount" 
              label="Standard Discount ($)"
            >
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
                <Input type="number" step="0.01" className="pl-10 bg-emerald-500/5 border-emerald-500/10 h-11 font-bold text-emerald-400" />
              </div>
            </FormFieldWrapper>

            <FormFieldWrapper 
              control={form.control} 
              name="notes" 
              label="Quotation Terms"
            >
              <Textarea 
                placeholder="Validity terms, delivery timelines..." 
                className="bg-white/5 border-white/10 min-h-[100px] resize-none text-xs text-white/60 focus:border-indigo-500/50" 
              />
            </FormFieldWrapper>
          </FormSection>

          <div className="bg-indigo-500/5 rounded-[32px] p-8 border border-indigo-500/10 flex flex-col justify-center gap-5 text-right shadow-2xl shadow-indigo-500/5">
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Estimate Subtotal</p>
               <h4 className="text-xl font-bold text-white/80">${subtotal.toFixed(2)}</h4>
             </div>
             {discount > 0 && (
               <div className="space-y-1">
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Applied Discount</p>
                 <h4 className="text-xl font-bold text-emerald-400">-${discount.toFixed(2)}</h4>
               </div>
             )}
             <div className="h-px bg-indigo-500/20 my-2" />
             <div className="space-y-2">
               <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">Grand Total Quote (USD)</p>
               <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                 ${total.toFixed(2)}
               </h2>
               <div className="flex items-center justify-end gap-2 text-[9px] text-muted-foreground font-bold uppercase py-2">
                 <Clock className="w-3 h-3 text-indigo-400" />
                 Valid for 14 Days
               </div>
             </div>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : "Submit Proposal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
