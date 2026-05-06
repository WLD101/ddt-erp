import { getPurchaseInvoices } from "@/modules/purchases/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { PageShell } from "@/components/dashboard/page-shell";

export default async function PurchasesPage() {
  const invoices = await getPurchaseInvoices();

  return (
    <PageShell
      title="Purchases"
      description="Track supplier bills, procurement activity, and inventory acquisition from one purchasing ledger."
      actions={
        <>
          <a
            href="/api/export/purchases"
            download
            className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">download</span>
            Export CSV
          </a>
          <Link href="/purchases/new">
            <Button className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px] mr-2">add_business</span>
              New Purchase
            </Button>
          </Link>
        </>
      }
      className="pb-20"
    >
      <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <Table>
          <TableHeader>
            <tr className="bg-surface-container-lowest border-b border-outline-variant/10">
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Bill Reference</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Execution Date</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Vendor Entity</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Protocol Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest pr-10">Settlement</th>
            </tr>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="group hover:bg-surface-container-low/20 transition-all duration-300">
                <TableCell className="px-8 py-6">
                  <span className="font-mono text-[10px] font-black text-primary tracking-[0.1em] bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                    {inv.invoiceNumber}
                  </span>
                </TableCell>
                <TableCell className="px-8 py-6 text-[11px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                  {format(new Date(inv.issueDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="px-8 py-6">
                  <span className="text-sm font-black text-on-surface tracking-tight">{inv.supplier.name}</span>
                </TableCell>
                <TableCell className="px-8 py-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/20 shadow-sm shadow-secondary/5">
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="px-8 py-6 text-right pr-10">
                   <p className="text-sm font-black text-on-surface tracking-tighter">
                     Rs. {(inv.totalAmount ?? 0).toLocaleString()}
                   </p>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-on-surface-variant/20">
                      <span className="material-symbols-outlined text-4xl">inventory_2</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">No Procurement Records</p>
                      <p className="text-[10px] font-medium text-on-surface-variant/60 italic">Register a new supply bill to begin organizational restock.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

