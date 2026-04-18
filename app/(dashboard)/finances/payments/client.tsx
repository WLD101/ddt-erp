"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, Wallet2, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { PaymentForm } from "@/modules/payments/components/payment-form";
import { deletePayment } from "@/modules/payments/actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  type: "IN" | "OUT";
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  date: Date;
}

export function PaymentClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [open, setOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingPayment(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deletingPayment) return;
    startDeleteTransition(async () => {
      const result = await deletePayment(deletingPayment.id);
      if (result.success) {
        toast.success("Transaction entry purged from vault");
        setDeletingPayment(null);
      } else {
        toast.error(result.error || "Failed to delete transaction");
      }
    });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Vault Transactions</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Real-time synchronization of liquid resource movements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
            <Plus className="w-4 h-4 mr-2" />
            Execute Transaction
          </Button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl flex-1 overflow-auto border-white/10">
        <Table>
          <TableHeader className="bg-white/5 sticky top-0 z-10">
            <TableRow className="border-white/10 hover:bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-muted-foreground">
              <TableHead className="py-5 pl-8">Movement Date</TableHead>
              <TableHead>Channel / Method</TableHead>
              <TableHead>Reference ID</TableHead>
              <TableHead className="text-right">Flow Value ($)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPayments.map((payment) => (
              <TableRow key={payment.id} className="border-white/5 group hover:bg-white/5 transition-colors duration-300">
                <TableCell className="text-muted-foreground font-medium pl-8 py-4">
                  {format(new Date(payment.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                     {payment.type === "IN" ? (
                       <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                     ) : (
                       <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" />
                     )}
                     <span className="font-bold text-white uppercase tracking-tight text-xs">
                        {payment.paymentMethod}
                     </span>
                   </div>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-tighter">
                  {payment.referenceNumber || "UNTRACKED"}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-black",
                  payment.type === "IN" ? "text-emerald-500" : "text-amber-500"
                )}>
                  {payment.type === "IN" ? "+" : "-"}${payment.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem onClick={() => handleEdit(payment)} className="gap-2 cursor-pointer font-bold">
                        <Pencil className="w-4 h-4 text-primary" /> Synchronize
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingPayment(payment)} className="gap-2 cursor-pointer text-rose-500 font-bold">
                        <Trash2 className="w-4 h-4" /> Purge Vault
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">
                  No vault movements recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
              <Wallet2 className="w-6 h-6 text-primary" />
              {editingPayment ? "Synchronize Vault" : "Authorize Transaction"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
              Executing legally binding financial resource movements
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1">
            <PaymentForm 
              initialData={editingPayment} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPayment} onOpenChange={(o) => !o && setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Critical Action: Purge Vault Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting this financial record is irreversible. The transaction history for this flow will be permanently removed, potentially desynchronizing associated invoices.
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
