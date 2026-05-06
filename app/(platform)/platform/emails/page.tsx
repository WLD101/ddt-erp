import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, ShieldCheck, Zap, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PlatformEmailsDashboard() {
  const logs = await prisma.emailLog.findMany({
    orderBy: { sentAt: "desc" },
    include: { user: true },
    take: 100
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-on-surface flex items-center gap-3">
            Lifecycle <span className="text-primary">Intelligence</span>
          </h2>
          <p className="text-muted-foreground text-sm">Monitor automated trial conversion sequences and re-engagement metrics.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-bold tracking-widest uppercase">
          <Mail className="w-4 h-4" />
          {logs.length} Sequences Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-surface/[0.02] border border-outline-variant/20 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
                <h4 className="text-on-surface font-bold uppercase text-[10px] tracking-widest leading-none mb-1">Health Status</h4>
                <p className="text-sm text-muted-foreground">Automated pulse is active and scanning millions of data points.</p>
            </div>
        </div>
        <div className="p-6 rounded-3xl bg-surface/[0.02] border border-outline-variant/20 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
                <h4 className="text-on-surface font-bold uppercase text-[10px] tracking-widest leading-none mb-1">Idempotency Layer</h4>
                <p className="text-sm text-muted-foreground">Zero-duplicate policy enforced via global EmailLog orchestration.</p>
            </div>
        </div>
        <div className="p-6 rounded-3xl bg-surface/[0.02] border border-outline-variant/20 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
                <h4 className="text-on-surface font-bold uppercase text-[10px] tracking-widest leading-none mb-1">Template Engine</h4>
                <p className="text-sm text-muted-foreground">React-based high-fidelity templates with dark mode support.</p>
            </div>
        </div>
      </div>

      <div className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface/40 backdrop-blur-xl shadow-2xl">
        <Table>
          <TableHeader className="bg-surface/[0.02]">
            <TableRow className="border-outline-variant/20 hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Event</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Recipient</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Subject</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Provider ID</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                  No lifecycle emails have been dispatched yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} className="border-outline-variant/20 hover:bg-surface/[0.02] transition-colors group">
                  <TableCell>
                     <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                         log.event === 'WELCOME' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                     }`}>
                         {log.event}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-on-surface tracking-tight">{log.user.name || "Anonymous"}</p>
                      <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant max-w-[200px] truncate">
                    {log.subject}
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">
                    {log.providerId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.sentAt).toLocaleString()}
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

