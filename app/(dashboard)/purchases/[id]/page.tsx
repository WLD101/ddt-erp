import { getPurchaseInvoiceById } from "@/modules/purchases/actions";
import { 
  Undo2, 
  ArrowLeft,
  Calendar,
  Truck,
  Hash,
  PackageCheck,
  DollarSign,
  Info,
  RotateCcw
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

export default async function PurchaseInvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await getPurchaseInvoiceById(params.id);

  if (!invoice) return notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <Link href="/purchases" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Back to Procurement
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Manifest <span className="text-primary italic">{invoice.invoiceNumber}</span></h1>
            <p className="text-muted-foreground text-sm">Validating inbound inventory and supplier commitments.</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all group">
              <Undo2 className="w-5 h-5 text-orange-400 group-hover:-rotate-90 transition-transform duration-500" />
              Return to Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-slate-950/95 backdrop-blur-3xl border-white/5 rounded-[32px] p-10 overflow-auto max-h-[90vh]">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-2xl">
                  <Undo2 className="w-6 h-6 text-orange-500" />
                </div>
                Outbound Return Workflow
              </DialogTitle>
            </DialogHeader>
            <ReturnForm type="PURCHASES" invoice={invoice} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Items Table */}
          <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                <PackageCheck className="w-4 h-4" />
                Received Inventory
              </h3>
            </div>
            
            <div className="space-y-4">
              {invoice.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="font-black text-white">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">SKU: {item.product.sku || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{item.quantity} x ${item.unitCost.toFixed(2)}</p>
                    <p className="text-xs text-primary font-bold">${item.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-8">
            <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <Info className="w-4 h-4" />
              Manifest Strategy
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Registration Date</p>
                  <p className="text-sm text-white font-medium">{format(new Date(invoice.issueDate || invoice.createdAt), "MMMM dd, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Supplier Entity</p>
                  <p className="text-sm text-white font-medium">{invoice.supplier.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5">
                  <DollarSign className="w-4 h-4 text-orange-400/70" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Billing Status</p>
                  <p className="text-sm text-white font-medium">{invoice.status}</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Billing Status</span>
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
                <span className="text-xs font-bold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-white border-t border-white/5 pt-4 mt-2">
                <span className="text-sm font-black uppercase tracking-widest">Valuation</span>
                <span className="text-xl font-black text-primary">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.returns && invoice.returns.length > 0 && (
            <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Outbound Returns
              </h3>
              <div className="space-y-4">
                {invoice.returns.map((ret: any) => (
                  <div key={ret.id} className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-white">{ret.returnNumber}</span>
                      <span className="text-xs font-black text-orange-400">-${ret.totalAmount.toFixed(2)}</span>
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
