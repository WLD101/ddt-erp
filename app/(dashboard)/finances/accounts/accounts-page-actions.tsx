"use client";

import React, { useState, useTransition } from "react";
import { Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createAccountAction, executeTransferAction } from "@/modules/finances/actions";

interface AccountsPageActionsProps {
  accounts: { id: string; name: string }[];
}

export function AccountsPageActions({ accounts }: AccountsPageActionsProps) {
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setShowTransfer(true)}
          className="h-12 px-6 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all"
        >
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          Transfer Funds
        </Button>
        <Button
          onClick={() => setShowNewAccount(true)}
          className="h-12 px-6 bg-primary hover:bg-primary/90 text-on-primary font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Account
        </Button>
      </div>

      <NewAccountModal open={showNewAccount} onOpenChange={setShowNewAccount} />
      <TransferFundsModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
        accounts={accounts}
      />
    </>
  );
}

/* ─────────── NEW ACCOUNT MODAL ─────────── */

function NewAccountModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "BANK">("BANK");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");

  function resetForm() {
    setName("");
    setType("BANK");
    setAccountNumber("");
    setBankName("");
    setInitialBalance("0");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Account name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createAccountAction({
        name: name.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        initialBalance: parseFloat(initialBalance) || 0,
      });

      if (result.success) {
        toast.success(`Account "${name}" created successfully.`);
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to create account.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-outline-variant/30">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-on-surface uppercase tracking-wider">
            Create Financial Account
          </DialogTitle>
          <DialogDescription className="text-sm text-on-surface-variant font-medium">
            Set up a new cash box or bank account for your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Account Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HBL Business Account"
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Account Type
            </label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="BANK">Bank Account</SelectItem>
                <SelectItem value="CASH">Cash Box</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "BANK" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Bank Name
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HBL"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Account Number
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="****1234"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Opening Balance (Rs.)
            </label>
            <Input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="h-11 rounded-xl font-bold"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-black text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest"
            >
              {isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── TRANSFER FUNDS MODAL ─────────── */

function TransferFundsModal({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function resetForm() {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setReason("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!fromAccountId || !toAccountId) {
      toast.error("Please select both source and destination accounts.");
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error("Source and destination accounts must be different.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Amount must be a positive number.");
      return;
    }

    startTransition(async () => {
      const result = await executeTransferAction({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        toast.success(`Transfer of Rs. ${parsedAmount.toLocaleString()} completed.`);
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Transfer failed.");
      }
    });
  }

  if (accounts.length < 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border-outline-variant/30">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-on-surface uppercase tracking-wider">
              Transfer Funds
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium">
              You need at least 2 financial accounts to perform inter-account transfers. Create another account first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-black text-xs uppercase tracking-widest"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-outline-variant/30">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-on-surface uppercase tracking-wider">
            Transfer Funds
          </DialogTitle>
          <DialogDescription className="text-sm text-on-surface-variant font-medium">
            Move funds between your financial accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Source Account
            </label>
            <Select value={fromAccountId} onValueChange={(val) => setFromAccountId(val ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select source..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Destination Account
            </label>
            <Select value={toAccountId} onValueChange={(val) => setToAccountId(val ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Amount (Rs.)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-11 rounded-xl font-bold text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Reason (Optional)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Petty cash refill"
              className="h-11 rounded-xl"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-black text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest"
            >
              {isPending ? "Processing..." : "Execute Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
