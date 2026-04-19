import { getAccountById } from "@/modules/finances/actions";
import { 
  ArrowLeft, 
  Calendar, 
  Building2, 
  Landmark, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  Download,
  Filter
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccountById(id);

  if (!account) return notFound();

  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-6">
          <Link href="/finances/accounts" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Back to Accounts
          </Link>
          <div className="flex items-center gap-6">
             <div className="h-20 w-20 rounded-[28px] bg-slate-900 border border-white/5 flex items-center justify-center shadow-2xl">
                {account.type === 'BANK' ? (
                  <Building2 className="w-10 h-10 text-primary" />
                ) : (
                  <Landmark className="w-10 h-10 text-orange-400" />
                )}
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tighter text-white italic">{account.name}</h1>
                  <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-black tracking-widest uppercase px-3">
                    {account.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  {account.type === 'BANK' ? `${account.bankName} • Account No: ${account.accountNumber}` : 'Local Cash Vault'}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/5 border-white/10 rounded-xl h-12 px-6 text-white font-black text-xs uppercase tracking-widest gap-2">
            <Download className="w-4 h-4 text-primary" />
            Statement
          </Button>
          <Button variant="outline" className="bg-white/5 border-white/10 rounded-xl h-12 px-6 text-white font-black text-xs uppercase tracking-widest gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Filters
          </Button>
        </div>
      </div>

      {/* Ledger Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white/[0.03] border border-white/5 rounded-[32px] p-8 space-y-6">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Current Real-time Balance</p>
              <p className="text-5xl font-black text-white italic tracking-tighter leading-none">${account.currentBalance.toLocaleString()}</p>
           </div>
           <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Initial Balance</p>
                <p className="text-lg font-bold text-white">${account.initialBalance.toLocaleString()}</p>
              </div>
              <div className="flex -space-x-2">
                 <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                 </div>
                 <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4 text-red-400" />
                 </div>
              </div>
           </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Search className="w-4 h-4" />
              Unified Account Ledger
            </h3>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Description</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Amount</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(account.ledgerEntries || []).map((entry: any) => (
                  <tr key={entry.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white tracking-widest uppercase">{format(new Date(entry.createdAt), "MMM dd")}</span>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(entry.createdAt), "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white leading-tight uppercase tracking-tight">{entry.description}</p>
                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-tighter bg-white/5 border-white/10 text-muted-foreground">
                          {entry.referenceType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <p className={`text-sm font-black italic ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <p className="text-xs font-black text-white italic opacity-60">
                         ${entry.balanceAfter.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                ))}
                {(account.ledgerEntries || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <Search className="w-8 h-8 text-muted-foreground opacity-20" />
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No ledger entries found</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
