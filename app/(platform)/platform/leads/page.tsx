import { getPlatformLeads } from "@/modules/leads/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Target, User, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PlatformLeadsDirectory() {
  const leads = await getPlatformLeads();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
            Lead <span className="text-primary">Intelligence</span>
          </h2>
          <p className="text-muted-foreground text-sm">Monitor and manage high-intent demo requests and inbound inquiries.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-bold tracking-widest uppercase">
          <Target className="w-4 h-4" />
          {leads.length} Active Leads
        </div>
      </div>

      <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Source</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Lead Info</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Company</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Created</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  No leads captured yet. 
                </TableCell>
              </TableRow>
            ) : (
              leads.map(lead => (
                <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell>
                     <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                         lead.source === 'DEMO' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                     }`}>
                         {lead.source}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white/50" />
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-tight">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-white/80">{lead.businessName || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.companySize ? `${lead.companySize} employees` : ""}</p>
                  </TableCell>
                  <TableCell>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(lead.status)}`}>
                         {lead.status}
                     </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/platform/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-bold uppercase tracking-tighter text-[10px]">
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'NEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'CONTACTED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'BOOKED': return 'bg-primary/10 text-primary border-primary/20';
        case 'QUALIFIED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'WON': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'LOST': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-white/5 text-muted-foreground border-white/10';
    }
}
