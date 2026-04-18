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
import { CustomerForm } from "@/modules/customers/components/customer-form";
import { deleteCustomer } from "@/modules/customers/actions";
import { toast } from "sonner";
import { Customer } from "@prisma/client";
import { cn } from "@/lib/utils";

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
        toast.success("Customer record purged from system");
        setDeletingCustomer(null);
      } else {
        toast.error(result.error || "Failed to delete customer");
      }
    });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Customers</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Global directory of legal and commercial entities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/5 bg-white/5 hover:bg-white/10" asChild>
            <a href="/api/export/customers" download>
              <Download className="w-4 h-4 mr-2" />
              Manifest CSV
            </a>
          </Button>
          <Button onClick={handleCreate} className="shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
            <Plus className="w-4 h-4 mr-2" />
            Onboard New
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
              <TableHead className="text-right">A/R Balance</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCustomers.map((customer) => (
              <TableRow key={customer.id} className="border-white/5 group hover:bg-white/5 transition-colors duration-300">
                <TableCell className="font-bold text-white pl-8 py-4">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground font-medium">{customer.email || "-"}</TableCell>
                <TableCell className="text-muted-foreground font-medium">{customer.phone || "-"}</TableCell>
                <TableCell className={cn(
                  "text-right font-black",
                  customer.balance > 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                  ${customer.balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem onClick={() => handleEdit(customer)} className="gap-2 cursor-pointer font-bold">
                        <Pencil className="w-4 h-4 text-primary" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingCustomer(customer)} className="gap-2 cursor-pointer text-rose-500 font-bold">
                        <Trash2 className="w-4 h-4" /> Purge Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">
                  No entities recorded in the database.
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
              {editingCustomer ? "Edit Commercial Profile" : "Institutional Onboarding"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Critical Action: Purge Record</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting "{deletingCustomer?.name}" is irreversible. All balance associations and contact history for this entity will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abort Operation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 font-black tracking-widest uppercase"
            >
              {isDeleting ? "Purging..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
