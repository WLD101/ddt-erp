import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PrintButton from "./print-button";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getCurrentTenantContext, TenantForbiddenError } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const ctx = await getCurrentTenantContext();

  const invoice = await prisma.salesInvoice.findUnique({
    where: { id_organizationId: { id: resolvedParams.id, organizationId: ctx.organizationId } },
    include: {
      customer: true,
      items: {
        include: { product: true }
      },
      organization: true,
    }
  });

  if (!invoice) notFound();

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Print Controls - Hidden during actual print */}
      <div className="print:hidden p-4 bg-gray-100 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold">Invoice Preview</h1>
          <p className="text-sm text-gray-500">This is how your invoice will appear on paper or PDF.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/sales">
            <Button variant="ghost" size="sm" className="text-gray-500">
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back
            </Button>
          </Link>
          <a href={`/api/sales/${invoice.id}/pdf`} download>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Invoice Document Box */}
      <div className="max-w-4xl mx-auto p-12 bg-surface print:p-0 print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h2 className="text-4xl font-extrabold text-blue-600 tracking-tight">INVOICE</h2>
            <p className="text-gray-500 mt-1 font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-xl">{invoice.organization.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Generated: {format(new Date(), "MMM dd, yyyy")}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-12">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To:</p>
            <p className="font-bold text-lg">{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.email || ""}</p>
            <p className="text-gray-600">{invoice.customer.phone || ""}</p>
            <p className="text-gray-600 max-w-xs">{invoice.customer.address || "No address on file"}</p>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Date:</p>
              <p className="font-medium">{format(new Date(invoice.date), "MMMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Status:</p>
              <p className={`font-bold ${invoice.status === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                {invoice.status}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-12 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-sm tracking-widest text-gray-500 uppercase">
              <th className="py-3 font-semibold w-1/2">Item Description</th>
              <th className="py-3 text-right font-semibold">Qty</th>
              <th className="py-3 text-right font-semibold">Unit Price</th>
              <th className="py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-surface"}>
                <td className="py-4 px-2 font-medium">{item.product.name}</td>
                <td className="py-4 px-2 text-right">{item.quantity}</td>
                <td className="py-4 px-2 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                <td className="py-4 px-2 text-right font-bold text-gray-900">Rs. {item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="flex justify-end">
          <div className="w-1/3 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>Rs. {invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-Rs. {invoice.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Tax:</span>
              <span>Rs. {invoice.taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t-2 border-gray-800 pt-3 mt-3">
              <span>Total:</span>
              <span>Rs. {invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-12">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Notes:</p>
            <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Thank you for your business. Please remit payment within 30 days.</p>
        </div>
      </div>
    </div>
  );
}
