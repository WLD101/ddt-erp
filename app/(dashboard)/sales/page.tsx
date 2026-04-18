import { getSalesInvoices } from "@/modules/sales/actions";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
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

export default async function SalesPage() {
  const invoices = await getSalesInvoices();

  return (
    <div className="p-8 space-y-6 flex-1 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Invoices</h2>
          <p className="text-muted-foreground">Manage your customer sales and revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href="/api/export/sales" download>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </a>
          </Button>
          <Link href="/sales/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      <div className="border rounded-md bg-background flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/${inv.id}/print`} className="text-primary hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{format(new Date(inv.issueDate), "MMM dd, yyyy")}</TableCell>
                <TableCell>{inv.customer.name}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">${inv.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <a href={`/api/sales/${inv.id}/pdf`} download>
                    <Button variant="ghost" size="sm">Export PDF</Button>
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No sales found. Go close some deals!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
