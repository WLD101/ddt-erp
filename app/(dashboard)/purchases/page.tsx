import { getPurchaseInvoices } from "@/modules/purchases/actions";
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

export default async function PurchasesPage() {
  const invoices = await getPurchaseInvoices();

  return (
    <div className="p-8 space-y-6 flex-1 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Invoices</h2>
          <p className="text-muted-foreground">Manage bills and inventory purchases from suppliers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href="/api/export/purchases" download>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </a>
          </Button>
          <Link href="/purchases/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bill
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
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{format(new Date(inv.issueDate), "MMM dd, yyyy")}</TableCell>
                <TableCell>{inv.supplier.name}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">${inv.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No purchases found. Create your first bill!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
