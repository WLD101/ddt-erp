// modules/suppliers/components/supplier-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTransition } from "react";
import { createSupplier, updateSupplier } from "../actions";
import { Supplier } from "@prisma/client";
import { toast } from "sonner";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSuccess?: () => void;
}

export function SupplierForm({ initialData, onSuccess }: SupplierFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
    },
  });

  function onSubmit(data: SupplierFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updateSupplier({ id: initialData.id, ...data })
        : await createSupplier(data);

      if (result.success) {
        toast.success(initialData ? "Supplier updated" : "Supplier registered");
        onSuccess?.();
      } else {
        toast.error(result.error || "Operation failed");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection 
          title="Corporate Identity" 
          description="Legal and commercial records"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="name" 
            label="Entity Name" 
            placeholder="E.g. Global Logistics Inc"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">corporate_fare</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="email" 
            label="Commercial Email" 
            placeholder="billing@supplier.com"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">mail</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="phone" 
            label="Procurement Line" 
            placeholder="+1 (555) 000-0000"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">call</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Warehouse & Logistics" 
          description="Primary center of operations"
          columns={1}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="address" 
            label="Corporate Address"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">location_on</span>
              <Textarea 
                className="pl-10 min-h-[100px] resize-none" 
                placeholder="Industrial zone, building number..."
              />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="px-8"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : initialData ? "Synchronize Entity" : "Register Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
