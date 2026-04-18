import { getUnifiedLedger } from "@/modules/finances/actions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { 
  Sheet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Search,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function LedgerPage() {
  const ledger = await getUnifiedLedger();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sheet className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Accounting Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Consolidated <span className="text-primary italic">Ledger</span></h1>
          <p className="text-muted-foreground text-sm max-w-md">
            A real-time, tamper-evident stream of all financial movements across all accounts and sites.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search ledger..." 
              className="w-72 bg-white/5 border-white/10 h-12 pl-12 rounded-2xl focus:ring-primary focus:border-primary transition-all" 
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 p-0">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 p-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-3xl shadow-2xl shadow-black/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 h-20">
              <TableHead className="pl-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Date & Type</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Description & Party</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Financial Account</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Volume</TableHead>
              <TableHead className="pr-8 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.map((item) => (
              <TableRow key={item.id} className="hover:bg-white/[0.03] border-white/5 group transition-all h-24">
                <TableCell className="pl-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl flex items-center justify-center ${
                      item.type === 'INFLOW' ? 'bg-emerald-500/10 text-emerald-400' : 
                      item.type === 'OUTFLOW' ? 'bg-red-500/10 text-red-400' : 
                      'bg-primary/10 text-primary'
                    }`}>
                      {item.type === 'INFLOW' ? <ArrowDownLeft className="w-5 h-5" /> : 
                       item.type === 'OUTFLOW' ? <ArrowUpRight className="w-5 h-5" /> : 
                       <ArrowRightLeft className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-black text-sm">{format(new Date(item.date), "MMM dd, yyyy")}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.type}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <p className="font-bold text-white/90 group-hover:text-white transition-colors">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-5 px-2 bg-white/5 border-white/10 text-muted-foreground tracking-widest">
                        {item.category}
                      </Badge>
                      <span className="text-[10px] text-primary/70 font-bold italic">@{item.party}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-bold text-muted-foreground tracking-tighter">{item.account}</span>
                </TableCell>

                <TableCell>
                  <div className={`text-lg font-black tracking-tighter ${
                    item.type === 'INFLOW' ? 'text-emerald-400' : 
                    item.type === 'OUTFLOW' ? 'text-red-400' : 
                    'text-white'
                  }`}>
                    {item.type === 'INFLOW' ? '+' : item.type === 'OUTFLOW' ? '-' : ''}
                    ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </TableCell>

                <TableCell className="pr-8 text-right">
                  <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                    {item.id.slice(-8).toUpperCase()}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {ledger.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-white/5 rounded-3xl">
                      <Sheet className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-white tracking-tight text-lg">Empty Ledger</p>
                      <p className="text-xs text-muted-foreground">Financial transactions will appear here once accounts are established and moves recorded.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
