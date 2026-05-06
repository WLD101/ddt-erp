import { getSalesInvoices } from "@/modules/sales/actions";
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

export default async function SalesPage() {
  const invoices = await getSalesInvoices();

  return (
    <PageShell
      title="Sales"
      description="Manage invoices, customer sales activity, and outgoing revenue records with one consistent ledger."
      actions={
        <>
          <a
            href="/api/export/sales"
            download
            className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">download</span>
            Export CSV
          </a>
          <Link href="/sales/new">
            <Button className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px] mr-2">add_shopping_cart</span>
              New Sale
            </Button>
          </Link>
        </>
      }
    >
      <div className="flex-1 overflow-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-8">Invoice Ref</TableHead>
              <TableHead>Execution Date</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Settlement (Rs.)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="group transition-all duration-200">
                <TableCell className="font-mono text-[11px] font-black text-primary pl-8">
                  <Link href={`/sales/${inv.id}/print`} className="hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-on-surface-variant font-medium">{format(new Date(inv.date), "MMM dd, yyyy")}</TableCell>
                <TableCell className="font-bold text-on-surface">{inv.customer.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-black text-on-surface">
                  {(inv.totalAmount ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <a href={`/api/sales/${inv.id}/pdf`} download>
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] font-black uppercase tracking-widest hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[16px] mr-1">picture_as_pdf</span>
                      PDF
                    </Button>
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-on-surface-variant font-medium italic">
                  No transaction records found in the ledger.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

