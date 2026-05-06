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
import { SupplierForm } from "@/modules/suppliers/components/supplier-form";
import { deleteSupplier } from "@/modules/suppliers/actions";
import { toast } from "sonner";
import { Supplier } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SupplierWithBalance extends Supplier {
  balance: number;
}

export function SupplierClient({ initialSuppliers }: { initialSuppliers: SupplierWithBalance[] }) {
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithBalance | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierWithBalance | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEdit = (supplier: SupplierWithBalance) => {
    setEditingSupplier(supplier);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deletingSupplier) return;
    startDeleteTransition(async () => {
      const result = await deleteSupplier(deletingSupplier.id);
      if (result.success) {
        toast.success("Supplier relationship terminated cleanly");
        setDeletingSupplier(null);
      } else {
        toast.error(result.error || "Failed to delete supplier");
      }
    });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md">Suppliers</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Upstream logistics and fulfillment partners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a 
             href="/api/export/suppliers" 
             download 
             className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 h-9 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">download</span>
            Export CSV
          </a>
          <Button onClick={handleCreate} className="h-9">
            <span className="material-symbols-outlined text-[18px] mr-2">group_add</span>
            Establish Partner
          </Button>
        </div>
      </div>

      <div className="border border-outline-variant/30 rounded-2xl bg-surface shadow-soft flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-8">Corporate Name</TableHead>
              <TableHead>Email Contact</TableHead>
              <TableHead>Direct Line</TableHead>
              <TableHead className="text-right">A/P Balance</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="group transition-all duration-200">
                <TableCell className="font-bold text-on-surface pl-8">{supplier.name}</TableCell>
                <TableCell className="text-on-surface-variant font-medium">{supplier.email || "-"}</TableCell>
                <TableCell className="text-on-surface-variant font-medium">{supplier.phone || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-black",
                  supplier.balance > 0 ? "text-error" : "text-secondary"
                )}>
                  Rs. {(supplier.balance ?? 0).toLocaleString()}
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
                      <DropdownMenuItem onClick={() => handleEdit(supplier)} className="gap-2 cursor-pointer font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingSupplier(supplier)} className="gap-2 cursor-pointer text-error font-medium">
                        <span className="material-symbols-outlined text-[18px]">delete</span> Terminate Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-on-surface-variant font-medium italic">
                  No upstream partners recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-surface border-outline-variant rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-on-surface tracking-tight font-headline-sm">
              {editingSupplier ? "Edit Partner Dynamics" : "Partner Integration"}
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium mt-2">
              Synchronize legally binding contact and fulfillment information
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1">
            <SupplierForm 
              initialData={editingSupplier} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingSupplier} onOpenChange={(o) => !o && setDeletingSupplier(null)}>
        <AlertDialogContent className="rounded-2xl border-outline-variant bg-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Critical Action: Terminate Link</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Warning: Deleting "{deletingSupplier?.name}" is irreversible. All outstanding purchase manifests and history for this partner will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-error text-on-error hover:opacity-90 font-bold rounded-lg"
            >
              {isDeleting ? "Terminating..." : "Confirm Termination"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

