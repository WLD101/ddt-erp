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
  category: string | null;
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
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md">Operational Expenses</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Tracking overhead and secondary resource consumption
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="h-9">
            <span className="material-symbols-outlined text-[18px] mr-2">receipt_long</span>
            Log Disbursement
          </Button>
        </div>
      </div>

      <div className="border border-outline-variant/30 rounded-2xl bg-surface shadow-soft flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-8">Execution Date</TableHead>
              <TableHead>Description / Narrative</TableHead>
              <TableHead>Cost Center</TableHead>
              <TableHead className="text-right">Amount Out (Rs.)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialExpenses.map((expense) => (
              <TableRow key={expense.id} className="group transition-all duration-200">
                <TableCell className="text-on-surface-variant font-medium pl-8 py-4">
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-bold text-on-surface uppercase tracking-tight">
                  {expense.description}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant/30">
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="text-right font-black text-error">
                  Rs. {(expense.amount ?? 0).toLocaleString()}
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
                      <DropdownMenuItem onClick={() => handleEdit(expense)} className="gap-2 cursor-pointer font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span> Edit Ledger
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingExpense(expense)} className="gap-2 cursor-pointer text-error font-medium">
                        <span className="material-symbols-outlined text-[18px]">delete</span> Purge Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-on-surface-variant font-medium italic">
                  No operational disbursements recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl bg-surface border-outline-variant rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-on-surface tracking-tight font-headline-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              {editingExpense ? "Modify Disbursement" : "Record Resource Flow"}
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium mt-2">
              Synchronize operational costs into the master ledger
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1">
            <ExpenseForm 
              initialData={editingExpense as any} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingExpense} onOpenChange={(o) => !o && setDeletingExpense(null)}>
        <AlertDialogContent className="rounded-2xl border-outline-variant bg-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Critical Action: Purge Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Warning: Deleting this ledger entry is irreversible. The financial record for "{deletingExpense?.description}" will be purged.
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
    </div>
  );
}
