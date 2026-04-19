"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, Download } from "lucide-react";
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
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Suppliers</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Upstream logistics and fulfillment partners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/5 bg-white/5 hover:bg-white/10" asChild>
            <a href="/api/export/suppliers" download>
              <Download className="w-4 h-4 mr-2" />
              Manifest CSV
            </a>
          </Button>
          <Button onClick={handleCreate} className="shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
            <Plus className="w-4 h-4 mr-2" />
            Establish Partner
          </Button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl flex-1 overflow-auto border-white/10">
        <Table>
          <TableHeader className="bg-white/5 sticky top-0 z-10">
            <TableRow className="border-white/10 hover:bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-muted-foreground">
              <TableHead className="py-5 pl-8">Corporate Name</TableHead>
              <TableHead>Email Contact</TableHead>
              <TableHead>Direct Line</TableHead>
              <TableHead className="text-right">A/P Balance</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="border-white/5 group hover:bg-white/5 transition-colors duration-300">
                <TableCell className="font-bold text-white pl-8 py-4">{supplier.name}</TableCell>
                <TableCell className="text-muted-foreground font-medium">{supplier.email || "-"}</TableCell>
                <TableCell className="text-muted-foreground font-medium">{supplier.phone || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-black",
                  supplier.balance > 0 ? "text-amber-500" : "text-emerald-500"
                )}>
                  ${supplier.balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100" />
                      }
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem onClick={() => handleEdit(supplier)} className="gap-2 cursor-pointer font-bold">
                        <Pencil className="w-4 h-4 text-primary" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingSupplier(supplier)} className="gap-2 cursor-pointer text-rose-500 font-bold">
                        <Trash2 className="w-4 h-4" /> Terminate Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">
                  No upstream partners recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white tracking-widest uppercase">
              {editingSupplier ? "Edit Partner Dynamics" : "Partner Integration"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Critical Action: Terminate Link</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting "{deletingSupplier?.name}" is irreversible. All outstanding purchase manifests and fulfillment history for this partner will be permanently removed from active ledgers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abort Operation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 font-black tracking-widest uppercase"
            >
              {isDeleting ? "Terminating..." : "Confirm Termination"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
