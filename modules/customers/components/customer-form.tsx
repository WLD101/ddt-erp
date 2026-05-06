// modules/customers/components/customer-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTransition } from "react";
import { createCustomer, updateCustomer } from "../actions";
import { Customer } from "@prisma/client";
import { toast } from "sonner";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSection } from "@/components/forms/form-section";

interface CustomerFormProps {
  initialData?: Customer | null;
  onSuccess?: () => void;
}

export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
    },
  });

  function onSubmit(data: CustomerFormValues) {
    startTransition(async () => {
      const result = initialData 
        ? await updateCustomer({ id: initialData.id, ...data })
        : await createCustomer(data);

      if (result.success) {
        toast.success(initialData ? "Customer updated successfully" : "Customer onboarded successfully");
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
          title="Profile Identity" 
          description="Primary contact and legal records"
          columns={2}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="name" 
            label="Legal Name" 
            placeholder="E.g. Acme Corp or John Doe"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">corporate_fare</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="email" 
            label="Email Address" 
            placeholder="client@example.com"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">mail</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>

          <FormFieldWrapper 
            control={form.control} 
            name="phone" 
            label="Direct Line" 
            placeholder="+1 (555) 000-0000"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">call</span>
              <Input className="pl-10" />
            </div>
          </FormFieldWrapper>
        </FormSection>

        <FormSection 
          title="Physical Coordinates" 
          description="Primary billing and shipping address"
          columns={1}
        >
          <FormFieldWrapper 
            control={form.control} 
            name="address" 
            label="Street Address"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">location_on</span>
              <Textarea 
                className="pl-10 min-h-[100px] resize-none" 
                placeholder="Suite, Street, City, ZIP..."
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
            ) : initialData ? "Update Profile" : "Onboard Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
