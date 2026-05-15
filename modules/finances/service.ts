import { ScopedPrisma } from "@/lib/db/client";
import { z } from "zod";
import { moneySchema, dateSchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CASH", "BANK"]),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  initialBalance: moneySchema.default(0),
});

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Source account is required"),
  toAccountId: z.string().min(1, "Destination account is required"),
  amount: moneySchema.refine(n => n > 0, "Amount must be positive"),
  date: dateSchema.default(() => new Date()),
  reason: z.string().optional(),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;

/**
 * ATOMIC HELPER: RECORD LEDGER ENTRY
 * This ensures the ledger and account balance are always in sync.
 */
export async function recordLedgerEntry(
  tx: any,
  params: {
    organizationId: string;
    branchId: string;
    accountId: string;
    amount: number; // Positive for inflow, Negative for outflow
    description: string;
    referenceType: "PAYMENT" | "EXPENSE" | "TRANSFER" | "OPENING_BALANCE" | "ADJUSTMENT";
    referenceId: string;
  }
) {
  // 1. Update the account balance
  const account = await tx.financialAccount.update({
    where: { id_organizationId: { id: params.accountId, organizationId: params.organizationId } },
    data: { currentBalance: { increment: params.amount } },
  });

  // 2. Create the ledger record with a balance snapshot
  return tx.ledgerEntry.create({
    data: {
      organizationId: params.organizationId,
      branchId: params.branchId,
      accountId: params.accountId,
      amount: params.amount,
      balanceAfter: account.currentBalance,
      description: params.description,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
    },
  });
}

/**
 * SERVICE: CREATE FINANCIAL ACCOUNT
 */
export async function createAccount(db: ScopedPrisma, branchId: string, data: AccountInput, userId: string) {
  return db.$transaction(async (tx: any) => {
    // 1. Create the account record
    const account = await tx.financialAccount.create({
      data: {
        organizationId: db.organizationId,
        name: data.name,
        type: data.type,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        currentBalance: 0, // Will be updated by opening balance entry
      },
    });

    // 2. Record the Opening Balance as the first ledger entry
    if (data.initialBalance !== 0) {
      await recordLedgerEntry(tx, {
        organizationId: db.organizationId,
        branchId,
        accountId: account.id,
        amount: data.initialBalance,
        description: "Opening Balance Initialization",
        referenceType: "OPENING_BALANCE",
        referenceId: account.id,
      });
    }

    await writeAuditLog(
      { organizationId: db.organizationId, user: { id: userId } } as any,
      "create_account",
      "FinancialAccount",
      account.id,
      `Created ${data.type} account "${data.name}" with opening balance ${data.initialBalance}`
    );

    return account;
  });
}

/**
 * SERVICE: EXECUTE INTER-ACCOUNT TRANSFER
 */
export async function executeTransfer(
  db: ScopedPrisma, 
  branchId: string,
  data: TransferInput,
  userId: string
) {
  if (data.fromAccountId === data.toAccountId) {
    throw new Error("Source and destination accounts must be different.");
  }

  return db.$transaction(async (tx: any) => {
    // 1. Validate Source Funds
    const [fromAcc, toAcc] = await Promise.all([
      tx.financialAccount.findUnique({
        where: { id_organizationId: { id: data.fromAccountId, organizationId: db.organizationId } },
      }),
      tx.financialAccount.findUnique({
        where: { id_organizationId: { id: data.toAccountId, organizationId: db.organizationId } },
      }),
    ]);
    if (!toAcc) {
      throw new Error("Destination account not found.");
    }
    if (!fromAcc || fromAcc.currentBalance < data.amount) {
      throw new Error(`Insufficient funds in ${fromAcc?.name || "Source Account"}.`);
    }

    // 2. Create Transfer Header Record
    const transfer = await tx.accountTransfer.create({
      data: {
        organizationId: db.organizationId,
        branchId,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        date: data.date,
        reason: data.reason || "Inter-account transfer",
      },
    });

    // 3. Record Outflow from Source
    await recordLedgerEntry(tx, {
      organizationId: db.organizationId,
      branchId,
      accountId: data.fromAccountId,
      amount: -data.amount,
      description: `Transfer to ${data.toAccountId} (Ref: ${transfer.id})`,
      referenceType: "TRANSFER",
      referenceId: transfer.id,
    });

    // 4. Record Inflow to Destination
    await recordLedgerEntry(tx, {
      organizationId: db.organizationId,
      branchId,
      accountId: data.toAccountId,
      amount: data.amount,
      description: `Transfer from ${data.fromAccountId} (Ref: ${transfer.id})`,
      referenceType: "TRANSFER",
      referenceId: transfer.id,
    });

    await writeAuditLog(
      { organizationId: db.organizationId, user: { id: userId } } as any,
      "execute_transfer",
      "AccountTransfer",
      transfer.id,
      `Transferred ${data.amount} from Account ${data.fromAccountId} to ${data.toAccountId}`
    );

    return transfer;
  });
}

/**
 * SERVICE: FETCH ACCOUNT LEDGER
 */
export async function getAccountLedger(db: ScopedPrisma, accountId: string) {
  return db.ledgerEntry.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function getAccounts(db: ScopedPrisma) {
  return db.financialAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getAccountById(db: ScopedPrisma, id: string) {
  return db.financialAccount.findUnique({
    where: { id },
    include: {
      ledgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 100,
      }
    }
  });
}

/**
 * SERVICE: UNIFIED LEDGER
 * Consolidated stream of all accounting entries.
 */
export async function getUnifiedLedger(db: ScopedPrisma) {
  const entries = await db.ledgerEntry.findMany({
    include: {
      account: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return entries.map(e => ({
    id: e.id,
    date: e.createdAt,
    type: e.amount > 0 ? "INFLOW" : "OUTFLOW",
    description: e.description,
    category: e.referenceType,
    party: "Internal",
    account: e.account.name,
    amount: Math.abs(e.amount),
  }));
}
