import { getSalesInvoiceById } from "@/modules/sales/actions";
import { 
  FileText, 
  RotateCcw, 
  ArrowLeft,
  Calendar,
  User,
  Hash,
  ShoppingBag,
  DollarSign,
  Info as BadgeInfo,
  FileDown,
  Printer
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { ReturnForm } from "@/components/returns/ReturnForm";
import { notFound } from "next/navigation";

export default async function SalesInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await getSalesInvoiceById(resolvedParams.id);

  if (!invoice) return notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/20 pb-10">
        <div className="space-y-4">
          <Link href="/sales" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Back to Sales
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-on-surface">Invoice <span className="text-primary italic">{invoice.invoiceNumber}</span></h1>
            <p className="text-muted-foreground text-sm">Reviewing transaction details and operational status.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/sales/${invoice.id}/print`}>
            <Button className="h-14 px-6 bg-primary text-on-primary font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all group">
              <Printer className="w-5 h-5" />
              Print Preview
            </Button>
          </Link>
          <a href={`/api/sales/${invoice.id}/pdf`} download>
            <Button variant="outline" className="h-14 px-6 border-primary/30 text-primary hover:bg-primary/10 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3">
              <FileDown className="w-5 h-5" />
              Download PDF
            </Button>
          </a>

          <Dialog>
            <DialogTrigger
              render={
                <Button className="h-14 px-8 bg-surface-container-low hover:bg-primary/20 border border-outline-variant/30 hover:border-primary/50 text-on-surface font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all group" />
              }
            >
              <RotateCcw className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
              Process Return
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-slate-950/95 backdrop-blur-3xl border-outline-variant/20 rounded-[32px] p-10 overflow-auto max-h-[90vh]">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-2xl">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  Return Workflow
                </DialogTitle>
              </DialogHeader>
              <ReturnForm type="SALES" invoice={invoice} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Items Table */}
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl overflow-hidden p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Purchased Items
              </h3>
            </div>
            
            <div className="space-y-4">
              {invoice.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-6 bg-slate-900/50 rounded-2xl border border-outline-variant/20">
                  <div className="space-y-1">
                    <p className="font-black text-on-surface">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">SKU: {item.product.sku || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-on-surface">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                    <p className="text-xs text-primary font-bold">${item.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Mini stats */}
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-8 space-y-8">
            <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <BadgeInfo className="w-4 h-4" />
              Document Context
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-outline-variant/20">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Issue Date</p>
                  <p className="text-sm text-on-surface font-medium">{format(new Date(invoice.issueDate), "MMMM dd, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-outline-variant/20">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Customer</p>
                  <p className="text-sm text-on-surface font-medium">{invoice.customer.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-outline-variant/20">
                  <DollarSign className="w-4 h-4 text-emerald-400/70" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Financial Status</p>
                  <p className="text-sm text-on-surface font-medium">{invoice.status}</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-widest">Document Status</span>
                <Badge variant="outline" className={`
                   ${invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                     invoice.status === 'RETURNED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                     invoice.status === 'PARTIAL_RETURNED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                     'bg-primary/10 text-primary border-primary/20'}
                `}>
                  {invoice.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">Subtotal</span>
                <span className="text-xs font-bold">${invoice.subtotal?.toFixed(2) || invoice.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface border-t border-outline-variant/20 pt-4 mt-2">
                <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                <span className="text-xl font-black text-primary">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.returns && invoice.returns.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-8 space-y-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Return History
              </h3>
              <div className="space-y-4">
                {invoice.returns.map((ret: any) => (
                  <div key={ret.id} className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl border border-outline-variant/20">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-on-surface">{ret.returnNumber}</span>
                      <span className="text-xs font-black text-red-400">-${ret.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                       <span>{format(new Date(ret.createdAt), "MMM dd, yyyy")}</span>
                       <span className="italic uppercase tracking-widest line-clamp-1 max-w-[120px]">{ret.reason || "No reason provided"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
