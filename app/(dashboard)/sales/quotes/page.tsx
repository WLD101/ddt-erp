import { getQuotations } from "@/modules/quotations/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RequestQuotationExportButton } from "./request-quotation-export-button";

export default async function QuotationsPage() {
  const quotes = await getQuotations();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Commercial <span className="text-primary">Estimates</span>
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-body-md">Manage commercial proposals and track organizational lead conversions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <RequestQuotationExportButton />
          <Button variant="outline" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px] mr-2">filter_list</span>
            Parameters
          </Button>
          <Link href="/sales/quotes/new">
            <Button className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Generate Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricBox 
           title="Active Proposals" 
           value={quotes.filter(q => q.status === 'SENT').length} 
           icon="schedule" 
           color="text-primary" 
           bgColor="bg-primary/5" 
         />
         <MetricBox 
           title="Conversion Rate" 
           value={`${quotes.length > 0 ? ((quotes.filter(q => q.status === 'CONVERTED').length / quotes.length) * 100).toFixed(1) : 0}%`} 
           icon="verified" 
           color="text-secondary" 
           bgColor="bg-secondary/5" 
         />
         <MetricBox 
           title="Pipeline Valuation" 
           value={`Rs. ${quotes.reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}`} 
           icon="account_balance_wallet" 
           color="text-on-surface" 
           bgColor="bg-surface-container" 
         />
      </div>

      {/* Table */}
      <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-soft">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-outline-variant/10">
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Quote Reference</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Client Entity</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Protocol Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Valuation</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {quotes.map((quote: any) => (
              <tr key={quote.id} className="group hover:bg-surface-container-low/20 transition-all duration-300">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">
                      {quote.quotationNumber}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-bold mt-1 flex items-center gap-1 uppercase tracking-widest opacity-60">
                       <span className="material-symbols-outlined text-[12px]">event_busy</span> 
                       Expires: {format(new Date(quote.expiryDate || quote.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-on-surface tracking-tight">{quote.customer?.name}</span>
                      <span className="text-[11px] font-medium text-on-surface-variant/60">{quote.customer?.email || 'N/A'}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   {formatStatus(quote.status)}
                </td>
                <td className="px-8 py-6 text-right">
                   <p className="text-sm font-black text-on-surface tracking-tight">
                     Rs. {quote.totalAmount.toLocaleString()}
                   </p>
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/sales/quotes/${quote.id}`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-xl border border-transparent hover:border-primary/20">
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                   <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center text-on-surface-variant/20">
                         <span className="material-symbols-outlined text-4xl">history_edu</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">No Commercial Records Found</p>
                        <p className="text-[10px] font-medium text-on-surface-variant/60 italic">Initialize your first commercial proposal to begin tracking.</p>
                      </div>
                      <Link href="/sales/quotes/new">
                        <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 border-outline-variant/30 hover:bg-surface-container-low">Create Proposal</Button>
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

function MetricBox({ title, value, icon, color, bgColor }: { title: string; value: string | number; icon: string; color: string; bgColor: string }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-[32px] p-6 flex items-center gap-6 shadow-sm">
       <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border border-outline-variant/10 shadow-sm", bgColor)}>
          <span className={cn("material-symbols-outlined text-[28px]", color)}>{icon}</span>
       </div>
       <div>
          <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-black text-on-surface tracking-tighter mt-1">{value}</p>
       </div>
    </div>
  );
}

function formatStatus(status: string) {
  const common = "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm";
  switch (status) {
    case 'SENT': return <Badge className={cn(common, "bg-primary/5 text-primary border-primary/20 shadow-primary/5")}>Protocol Sent</Badge>;
    case 'ACCEPTED': return <Badge className={cn(common, "bg-secondary/5 text-secondary border-secondary/20 shadow-secondary/5")}>Approved</Badge>;
    case 'CONVERTED': return <Badge className={cn(common, "bg-primary text-on-primary border-primary shadow-primary/10")}>Archived</Badge>;
    case 'REJECTED': return <Badge className={cn(common, "bg-error/5 text-error border-error/20 shadow-error/5")}>Declined</Badge>;
    case 'EXPIRED': return <Badge className={cn(common, "bg-surface-container text-on-surface-variant/40 border-outline-variant/30 shadow-none")}>Stale</Badge>;
    default: return <Badge className={cn(common, "bg-surface-container-low text-on-surface-variant/60 border-outline-variant/20 shadow-none")}>Draft Node</Badge>;
  }
}

