import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrintButton from "./print-button";
import { getQuotationById } from "@/modules/quotations/actions";

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const quote = (await getQuotationById(resolvedParams.id)) as any;

  if (!quote) {
    notFound();
  }

  const subtotal = quote.items.reduce((sum: number, item: any) => sum + item.total, 0);
  const currency = quote.organization?.currency || "PKR";
  const money = (value: number) => {
    const symbol = currency === "PKR" ? "Rs." : currency;
    return `${symbol} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-4 print:hidden">
        <div>
          <h1 className="text-lg font-bold">Quotation Preview</h1>
          <p className="text-sm text-gray-500">
            This is how your quotation will appear when printed or downloaded as a PDF.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/sales/quotes/${quote.id}`}>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <a href={`/api/quotations/${quote.id}/pdf`} download>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-4xl bg-surface p-12 print:m-0 print:p-0">
        <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-blue-600">QUOTATION</h2>
            <p className="mt-1 font-medium text-gray-500">{quote.quotationNumber}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold">{quote.organization?.name || "WhatsQuery Workspace"}</h3>
            <p className="mt-1 text-sm text-gray-500">Generated: {format(new Date(), "MMM dd, yyyy")}</p>
          </div>
        </div>

        <div className="mb-12 flex justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">Prepared For:</p>
            <p className="text-lg font-bold">{quote.customer.name}</p>
            <p className="text-gray-600">{quote.customer.email || ""}</p>
            <p className="text-gray-600">{quote.customer.phone || ""}</p>
            <p className="max-w-xs text-gray-600">{quote.customer.address || "No address on file"}</p>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Issue Date:</p>
              <p className="font-medium">{format(new Date(quote.createdAt), "MMMM dd, yyyy")}</p>
            </div>
            {quote.expiryDate ? (
              <div className="mb-4">
                <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Valid Until:</p>
                <p className="font-medium">{format(new Date(quote.expiryDate), "MMMM dd, yyyy")}</p>
              </div>
            ) : null}
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">Status:</p>
              <p className="font-bold text-blue-600">{quote.status}</p>
            </div>
          </div>
        </div>

        <table className="mb-12 w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-gray-800 text-sm uppercase tracking-widest text-gray-500">
              <th className="w-1/2 py-3 font-semibold">Item Description</th>
              <th className="py-3 font-semibold text-center">Unit</th>
              <th className="py-3 font-semibold text-right">Qty</th>
              <th className="py-3 font-semibold text-right">Unit Price</th>
              <th className="py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quote.items.map((item: any, index: number) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-surface"}>
                <td className="px-2 py-4 font-medium">{item.product.name}</td>
                <td className="px-2 py-4 text-center">{item.product.unit || "unit"}</td>
                <td className="px-2 py-4 text-right">{item.quantity}</td>
                <td className="px-2 py-4 text-right">{money(item.unitPrice)}</td>
                <td className="px-2 py-4 text-right font-bold text-gray-900">{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/3 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{money(subtotal)}</span>
            </div>
            {quote.discount > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{money(quote.discount)}</span>
              </div>
            ) : null}
            <div className="mt-3 flex justify-between border-t-2 border-gray-800 pt-3 text-xl font-bold">
              <span>Total:</span>
              <span>{money(quote.totalAmount)}</span>
            </div>
          </div>
        </div>

        {quote.notes ? (
          <div className="mt-12">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">Terms & Notes:</p>
            <p className="whitespace-pre-wrap text-gray-600">{quote.notes}</p>
          </div>
        ) : null}

        <div className="mt-20 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>{quote.organization?.name || "Your workspace"}</p>
          <p>Generated using WhatsQuery.com</p>
        </div>
      </div>
    </div>
  );
}
