"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, Receipt } from "lucide-react";
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
import { ExpenseForm } from "@/modules/expenses/components/expense-form";
import { deleteExpense } from "@/modules/expenses/actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
}

export function ExpenseClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingExpense(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deletingExpense) return;
    startDeleteTransition(async () => {
      const result = await deleteExpense(deletingExpense.id);
      if (result.success) {
        toast.success("Expense ledger record purged");
        setDeletingExpense(null);
      } else {
        toast.error(result.error || "Failed to delete expense");
      }
    });
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Operational Expenses</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Tracking overhead and secondary resource consumption
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
            <Plus className="w-4 h-4 mr-2" />
            Log Disbursement
          </Button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl flex-1 overflow-auto border-white/10">
        <Table>
          <TableHeader className="bg-white/5 sticky top-0 z-10">
            <TableRow className="border-white/10 hover:bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-muted-foreground">
              <TableHead className="py-5 pl-8">Execution Date</TableHead>
              <TableHead>Description / Narrative</TableHead>
              <TableHead>Cost Center</TableHead>
              <TableHead className="text-right">Amount Out ($)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialExpenses.map((expense) => (
              <TableRow key={expense.id} className="border-white/5 group hover:bg-white/5 transition-colors duration-300">
                <TableCell className="text-muted-foreground font-medium pl-8 py-4">
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-bold text-white uppercase tracking-tight">
                  {expense.description}
                </TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-white/5">
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="text-right font-black text-rose-500">
                  ${expense.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem onClick={() => handleEdit(expense)} className="gap-2 cursor-pointer font-bold">
                        <Pencil className="w-4 h-4 text-primary" /> Edit Ledger
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingExpense(expense)} className="gap-2 cursor-pointer text-rose-500 font-bold">
                        <Trash2 className="w-4 h-4" /> Purge Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">
                  No operational disbursements recorded.
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
              <Receipt className="w-6 h-6 text-primary" />
              {editingExpense ? "Modify Disbursement" : "Record Resource Flow"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
              Synchronize operational costs into the master ledger
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1">
            <ExpenseForm 
              initialData={editingExpense} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingExpense} onOpenChange={(o) => !o && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Critical Action: Purge Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting this ledger entry is irreversible. The financial record for "{deletingExpense?.description}" will be purged, affecting reporting balances.
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
