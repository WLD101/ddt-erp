import { getQuotationById } from "@/modules/quotations/actions";
import { 
  ArrowLeft, 
  Download, 
  Send, 
  ShoppingCart, 
  Calendar, 
  User, 
  Hash, 
  Package,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  AlertCircle,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
  const quote = await getQuotationById(params.id);

  if (!quote) return notFound();

  const isConverted = quote.status === 'CONVERTED';
  const isExpired = new Date(quote.expiryDate) < new Date() && !isConverted;

  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto h-full overflow-auto">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/sales/quotes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Proposals
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-white/10 text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-white/5">
             Ref: {quote.quotationNumber}
          </Badge>
          {formatStatus(quote.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
              
              <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter">Commercial Proposal</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Institutional Quotation & Terms</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                       <User className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="font-bold uppercase tracking-tighter">Prepared For:</span> {quote.customer.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                       <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="font-bold uppercase tracking-tighter">Issued:</span> {format(new Date(quote.date), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                       <Clock className="w-3.5 h-3.5 text-rose-400" />
                       <span className="font-bold uppercase tracking-tighter text-rose-400/70">Expires:</span> {format(new Date(quote.expiryDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estimate Total</p>
                   <h2 className="text-6xl font-black text-white italic tracking-tighter">${quote.totalAmount.toLocaleString()}</h2>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-3xl border border-white/5 overflow-hidden bg-white/5 relative z-10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {quote.items.map((item: any) => (
                      <tr key={item.id} className="text-white/80">
                        <td className="px-6 py-5 font-bold uppercase tracking-tighter text-xs">{item.product.name}</td>
                        <td className="px-6 py-5 text-center font-mono text-xs">{item.quantity}</td>
                        <td className="px-6 py-5 text-right text-xs">${item.unitPrice.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right font-black text-xs italic">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 relative z-10">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proposal Terms</h4>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/60 leading-relaxed italic">
                  {quote.notes || "No additional terms provided for this proposal."}
                </div>
              </div>
           </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
           {/* Primary Conversion Card */}
           <div className="bg-indigo-600 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(79,70,229,0.3)] space-y-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                 <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Convert to Sale</h3>
                 <p className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                   Authorized acceptance of this commercial proposal into a binding inventory transaction.
                 </p>
              </div>
              {!isConverted && !isExpired ? (
                <Link href={`/sales/new?fromQuote=${quote.id}`} className="w-full">
                  <Button className="w-full h-14 bg-white text-indigo-600 hover:bg-white/90 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">
                    Accept & Finalize
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full h-14 bg-white/20 text-white/50 font-black uppercase tracking-widest rounded-2xl">
                   {isConverted ? 'Already Converted' : 'Proposal Expired'}
                </Button>
              )}
           </div>

           {/* Auxiliary Actions */}
           <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 space-y-4">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-2">Management Toolkit</h4>
              <Button variant="outline" className="w-full h-12 justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest text-white/70">
                <Printer className="w-4 h-4 text-indigo-400" />
                Print Proposal
              </Button>
              <Button variant="outline" className="w-full h-12 justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest text-white/70">
                <Send className="w-4 h-4 text-indigo-400" />
                Send via Email
              </Button>
              <div className="h-px bg-white/5 my-2" />
              <Button variant="ghost" className="w-full h-12 justify-start gap-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl font-bold uppercase text-[10px] tracking-widest text-white/40 transition-colors">
                <Trash2 className="w-4 h-4" />
                Draft Disposal
              </Button>
           </div>

           {/* Linked Sales */}
           {quote.salesInvoices.length > 0 && (
             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-8 space-y-4">
                <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Linked Sales</h4>
                </div>
                {quote.salesInvoices.map((inv: any) => (
                   <Link key={inv.id} href={`/sales/${inv.id}`} className="flex justify-between items-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                      <span className="text-[10px] font-black text-white">{inv.invoiceNumber}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                   </Link>
                ))}
             </div>
           )}

           {isExpired && (
             <div className="bg-orange-500/10 border border-orange-500/20 rounded-[32px] p-8 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                   <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Proposal Expired</h4>
                   <p className="text-[9px] text-orange-100/40 font-medium leading-relaxed">
                     This proposal crossed its validity window on {format(new Date(quote.expiryDate), "MMM dd")}. Re-negotiation required.
                   </p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case 'SENT': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Active sent</Badge>;
    case 'ACCEPTED': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Accepted</Badge>;
    case 'CONVERTED': return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Converted</Badge>;
    case 'REJECTED': return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Rejected</Badge>;
    case 'EXPIRED': return <Badge className="bg-white/10 text-muted-foreground border-white/10 text-[9px] font-black uppercase tracking-widest px-2 py-1">Expired</Badge>;
    default: return <Badge className="bg-white/5 text-white/40 border-white/5 text-[9px] font-black uppercase tracking-widest px-2 py-1">Draft</Badge>;
  }
}
