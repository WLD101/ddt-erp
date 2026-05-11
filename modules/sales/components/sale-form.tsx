/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// modules/sales/components/sale-form.tsx
"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { cn } from "@/lib/utils";
import { usePlanModal } from "@/components/billing/PlanProvider";

interface SaleFormProps {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; unitPrice: number; availableQuantity: number }[];
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
      quotationId: initialData?.quotationId || undefined,
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

  function getStockIssues(data: SalesInvoiceFormValues) {
    const requestedQuantityByProduct = new Map<string, number>();

    for (const item of data.items) {
      requestedQuantityByProduct.set(
        item.productId,
        (requestedQuantityByProduct.get(item.productId) ?? 0) + Number(item.quantity || 0)
      );
    }

    return data.items
      .map((item, index) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          return null;
        }

        const requestedQuantity = requestedQuantityByProduct.get(item.productId) ?? 0;
        if (requestedQuantity <= product.availableQuantity) {
          return null;
        }

        return {
          index,
          productName: product.name,
          availableQuantity: product.availableQuantity,
          requestedQuantity,
        };
      })
      .filter(Boolean) as Array<{
        index: number;
        productName: string;
        availableQuantity: number;
        requestedQuantity: number;
      }>;
  }

  function onSubmit(data: SalesInvoiceFormValues) {
    if (initialData?.id) {
      toast.info("Sales editing is coming soon to the backend. UI finalized.");
      return;
    }

    form.clearErrors();
    const stockIssues = getStockIssues(data);
    if (stockIssues.length > 0) {
      for (const issue of stockIssues) {
        form.setError(`items.${issue.index}.quantity`, {
          type: "manual",
          message: `Only ${issue.availableQuantity} in stock for ${issue.productName}.`,
        });
      }
      toast.error(
        `${stockIssues[0].productName} has only ${stockIssues[0].availableQuantity} in stock.`
      );
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

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
    defaultValue: form.getValues("items"),
  });

  const watchedDiscount = useWatch({
    control: form.control,
    name: "discount",
    defaultValue: form.getValues("discount"),
  });

  const subtotal = (watchedItems || []).reduce((acc, item) => acc + (item.quantity * (item.unitPrice || 0)), 0);
  const discount = Number(watchedDiscount) || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <input type="hidden" {...form.register("quotationId")} />
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
              <SelectTrigger>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-[18px] mr-2 text-outline">person</span>
                  <SelectValue placeholder="Identify customer..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-outline-variant shadow-lg rounded-xl">
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
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">tag</span>
              <Input className="pl-10 font-mono text-[11px] uppercase tracking-wider" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              Inventory Allocation
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
              className="font-bold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
              Add Line Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
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
                        <SelectTrigger className="bg-surface-container-low/50">
                          <div className="flex items-center">
                            <span className="material-symbols-outlined text-[18px] mr-2 text-outline">package</span>
                            <SelectValue placeholder="Pick Product" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-outline-variant shadow-lg rounded-xl">
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
                      <Input type="number" className="text-center font-bold" />
                    </FormFieldWrapper>
                    {(() => {
                      const selectedProductId = form.watch(`items.${index}.productId`);
                      const selectedProduct = products.find((product) => product.id === selectedProductId);
                      if (!selectedProduct) {
                        return null;
                      }

                      const requestedQuantity = Number(watchedItems?.[index]?.quantity || 0);
                      const isOverRequested = requestedQuantity > selectedProduct.availableQuantity;

                      return (
                        <p
                          className={cn(
                            "mt-2 text-[10px] font-bold uppercase tracking-[0.12em]",
                            isOverRequested ? "text-error" : "text-on-surface-variant"
                          )}
                        >
                          Available stock: {selectedProduct.availableQuantity}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="md:col-span-3">
                    <FormFieldWrapper 
                      control={form.control} 
                      name={`items.${index}.unitPrice`} 
                      label="Unit Rate (Rs.)"
                    >
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">payments</span>
                        <Input type="number" step="0.01" className="pl-9" />
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
                      className="text-on-surface-variant hover:text-error hover:bg-error/10 transition-all rounded-full"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
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
              label="Flat Discount (Rs.)"
            >
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-error">money_off</span>
                <Input type="number" step="0.01" className="pl-10 font-bold text-error bg-error/[0.02]" />
              </div>
            </FormFieldWrapper>

            <FormFieldWrapper 
              control={form.control} 
              name="notes" 
              label="Invoice Terms"
            >
              <Textarea 
                placeholder="Specific delivery terms, payment windows, or thank you notes..." 
                className="min-h-[100px] resize-none" 
              />
            </FormFieldWrapper>
          </FormSection>

          <Card className="bg-primary/[0.02] border-primary/10 shadow-none">
            <CardContent className="p-8 flex flex-col justify-center gap-4 text-right">
               <div className="space-y-1">
                 <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em]">Gross Subtotal</p>
                 <h4 className="text-xl font-bold text-on-surface/80">Rs. {subtotal.toLocaleString()}</h4>
               </div>
               {discount > 0 && (
                 <div className="space-y-1">
                   <p className="text-[10px] text-error font-black uppercase tracking-[0.2em]">Institutional Discount</p>
                   <h4 className="text-xl font-bold text-error">-Rs. {discount.toLocaleString()}</h4>
                 </div>
               )}
               <div className="h-px bg-outline-variant/30 my-2" />
               <div className="space-y-1">
                 <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Final Payable Amount (PKR)</p>
                 <h2 className="text-5xl font-black text-on-surface tracking-tighter">
                   Rs. {total.toLocaleString()}
                 </h2>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-6 border-t border-outline-variant/30">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-14 text-xl font-black uppercase tracking-[0.2em]"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            ) : initialData?.id ? "Synchronize Sale" : "Authorize Final Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
