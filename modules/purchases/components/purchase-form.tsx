// modules/purchases/components/purchase-form.tsx
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPurchaseInvoice } from "../actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Building, Hash, Tag, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";

const purchaseInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Cost must be a positive number"),
});

const purchaseInvoiceSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(purchaseInvoiceItemSchema).min(1, "At least one item is required"),
});

type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

interface PurchaseFormProps {
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; costPrice: number }[];
  initialData?: any;
  onSuccess?: () => void;
}

export function PurchaseForm({ suppliers, products, initialData, onSuccess }: PurchaseFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || "",
      invoiceNumber: initialData?.invoiceNumber || `PUR-${Date.now().toString().slice(-6)}`,
      items: initialData?.items?.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost
      })) || [{ productId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function onSubmit(data: PurchaseInvoiceFormValues) {
    if (initialData) {
      toast.info("Purchase editing is coming soon to the backend. UI finalized.");
      return;
    }
    startTransition(async () => {
      const result = await createPurchaseInvoice(data);
      if (result.success) {
        toast.success("Purchase order finalized");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to log purchase");
      }
    });
  }

  const watchedItems = form.watch("items");
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <FormSection 
          title="Procurement Header" 
          description="Supplier assignment and external reference"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="supplierId" 
            label="Verified Supplier"
          >
            <Select onValueChange={(val) => form.setValue("supplierId", val)} defaultValue={form.getValues("supplierId")}>
              <SelectTrigger className="h-11">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-muted-foreground/60" />
                  <SelectValue placeholder="Identify supplier..." />
                </div>
              </SelectTrigger>
              <SelectContent className="border-outline-variant">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="invoiceNumber" 
            label="Supplier Ref #"
          >
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-10 h-11 font-mono text-xs uppercase tracking-tighter" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              Manifest Line Items
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
              className="border-primary/20 hover:bg-primary/10 text-primary font-bold transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Record Inbound Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-outline-variant/30 bg-surface-container-low overflow-hidden group hover:border-emerald-500/20 transition-colors duration-500">
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
                            form.setValue(`items.${index}.unitCost`, product.costPrice);
                          }
                        }} 
                        defaultValue={form.getValues(`items.${index}.productId`)}
                      >
                        <SelectTrigger className="h-10">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2 text-muted-foreground/40" />
                            <SelectValue placeholder="Pick Product" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="border-outline-variant">
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
                      <Input type="number" className="h-10 text-center font-bold" />
                    </FormFieldWrapper>
                  </div>
                  <div className="md:col-span-3">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.unitCost`} 
                      label="Purchase Rate ($)"
                    >
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                        <Input type="number" step="0.01" className="pl-9 h-10" />
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
                      className="text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pr-4 text-right">
           <div className="bg-emerald-500/5 rounded-3xl p-8 border border-emerald-500/10 flex flex-col justify-center gap-4 min-w-[300px] shadow-2xl shadow-emerald-500/5">
             <div className="space-y-1 text-center sm:text-right">
               <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-1 flex items-center justify-end gap-2">
                 <Truck className="w-3 h-3" /> Total Procurement Cost (USD)
               </p>
               <h2 className="text-5xl font-black text-on-surface tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                 ${subtotal.toFixed(2)}
               </h2>
             </div>
           </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.6)] active:scale-95"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : initialData ? "Synchronize Purchase" : "Verify Inbound Manifest"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
