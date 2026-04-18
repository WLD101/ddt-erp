import { getQuotations } from "@/modules/quotations/actions";
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  ArrowRight,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function QuotationsPage() {
  const quotes = await getQuotations();

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-xl">
               <FileText className="w-5 h-5 text-indigo-400" />
             </div>
             <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
               Quotations <span className="text-indigo-400">&</span> Estimates
             </h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Manage commercial proposals and track lead conversions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-6 bg-white/5 border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/10">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Link href="/sales/quotes/new">
            <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Plus className="w-4 h-4" />
              Generate Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
               <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Proposals</p>
               <p className="text-2xl font-black text-white italic">{quotes.filter(q => q.status === 'SENT').length}</p>
            </div>
         </div>
         <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
               <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Conversion Rate</p>
               <p className="text-2xl font-black text-white italic">
                 {quotes.length > 0 ? ((quotes.filter(q => q.status === 'CONVERTED').length / quotes.length) * 100).toFixed(1) : 0}%
               </p>
            </div>
         </div>
         <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
               <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pipeline</p>
               <p className="text-2xl font-black text-white italic">${quotes.reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}</p>
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl glass-morphism">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic border-b border-white/5">Details</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic border-b border-white/5">Customer</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic border-b border-white/5">Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic border-b border-white/5">Total Amount</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic border-b border-white/5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {quotes.map((quote) => (
              <tr key={quote.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white tracking-widest flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                      {quote.quotationNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-bold">
                       <Calendar className="w-3 h-3" /> Expires: {format(new Date(quote.expiryDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{quote.customer?.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{quote.customer?.email || 'No email'}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   {formatStatus(quote.status)}
                </td>
                <td className="px-8 py-6 text-right">
                   <p className="text-lg font-black text-white tracking-tighter italic">
                     ${quote.totalAmount.toLocaleString()}
                   </p>
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/sales/quotes/${quote.id}`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all rounded-xl">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-20">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                      <p className="text-xs font-black uppercase tracking-widest italic">No Quotations Found</p>
                      <Link href="/sales/quotes/new">
                        <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border-white/10 hover:bg-white/5">Create Your First Proposal</Button>
                      </Link>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case 'SENT': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Sent</Badge>;
    case 'ACCEPTED': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Accepted</Badge>;
    case 'CONVERTED': return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Converted</Badge>;
    case 'REJECTED': return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1">Rejected</Badge>;
    case 'EXPIRED': return <Badge className="bg-white/10 text-muted-foreground border-white/10 text-[9px] font-black uppercase tracking-widest px-2 py-1">Expired</Badge>;
    default: return <Badge className="bg-white/5 text-white/40 border-white/5 text-[9px] font-black uppercase tracking-widest px-2 py-1">Draft</Badge>;
  }
}
