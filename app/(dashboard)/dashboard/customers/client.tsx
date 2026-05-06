"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerForm } from "@/modules/customers/components/customer-form";
import { deleteCustomer } from "@/modules/customers/actions";
import { toast } from "sonner";
import { Customer } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/dashboard/page-shell";

interface CustomerWithBalance extends Customer {
  balance: number;
}

export function CustomerClient({ initialCustomers }: { initialCustomers: CustomerWithBalance[] }) {
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithBalance | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerWithBalance | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEdit = (customer: CustomerWithBalance) => {
    setEditingCustomer(customer);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deletingCustomer) return;
    startDeleteTransition(async () => {
      const result = await deleteCustomer(deletingCustomer.id);
      if (result.success) {
        toast.success("Customer record purged successfully");
        setDeletingCustomer(null);
      } else {
        toast.error(result.error || "Failed to delete customer");
      }
    });
  };

  return (
    <>
      <PageShell
        title="Customers"
        description="Manage your customer directory, contact details, and receivable balances in one workspace."
        actions={
          <>
            <a
              href="/api/export/customers"
              download
              className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px] mr-2">download</span>
              Export CSV
            </a>
            <Button onClick={handleCreate} className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px] mr-2">person_add</span>
              Add Customer
            </Button>
          </>
        }
      >
        <div className="flex-1 overflow-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-8">Corporate Name</TableHead>
              <TableHead>Email Contact</TableHead>
              <TableHead>Direct Line</TableHead>
              <TableHead className="text-right">A/R Balance</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCustomers.map((customer) => (
              <TableRow key={customer.id} className="group transition-all duration-200">
                <TableCell className="font-bold text-on-surface pl-8">{customer.name}</TableCell>
                <TableCell className="text-on-surface-variant font-medium">{customer.email || "-"}</TableCell>
                <TableCell className="text-on-surface-variant font-medium">{customer.phone || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-black",
                  customer.balance > 0 ? "text-error" : "text-secondary"
                )}>
                  Rs. {(customer.balance ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="bg-surface border-outline-variant shadow-lg rounded-xl">
                      <DropdownMenuItem onClick={() => handleEdit(customer)} className="gap-2 cursor-pointer font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingCustomer(customer)} className="gap-2 cursor-pointer text-error font-medium">
                        <span className="material-symbols-outlined text-[18px]">delete</span> Delete Entity
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-on-surface-variant font-medium italic">
                  No entities found in the system.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </PageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-surface border-outline-variant rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-on-surface tracking-tight font-headline-sm">
              {editingCustomer ? "Edit Commercial Profile" : "Institutional Onboarding"}
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium mt-2">
              Record legally binding contact and logistic information
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1">
            <CustomerForm 
              initialData={editingCustomer} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCustomer} onOpenChange={(o) => !o && setDeletingCustomer(null)}>
        <AlertDialogContent className="rounded-2xl border-outline-variant bg-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Critical Action: Purge Record</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Warning: Deleting "{deletingCustomer?.name}" is irreversible. All balance associations and history for this entity will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-error text-on-error hover:opacity-90 font-bold rounded-lg"
            >
              {isDeleting ? "Purging..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

