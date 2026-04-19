import { getPlatformTenants } from "@/modules/platform/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  Server, 
  ExternalLink, 
  Trash2, 
  ShieldCheck, 
  LayoutGrid,
  CreditCard,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PlatformTenantsDirectory() {
  const tenants = await getPlatformTenants();

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full w-fit">
            <LayoutGrid className="w-3 h-3 text-primary fill-primary/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tenant Inventory</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4 mt-2">
            Workspace <span className="text-primary">Directory</span>
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Global access to organization metadata, subscription states, and operational footprints.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
             <div className="text-right">
               <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Global Footprint</p>
               <p className="text-xs font-bold text-white tracking-widest">{tenants.length} Instances</p>
             </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-tighter h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
             Provision New Vault
          </Button>
        </div>
      </div>

      <div className="border border-white/5 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground h-14 pl-8">Workspace Entity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground h-14">Tier & Auth</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground h-14 text-center">Resources</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground h-14">Provisioned</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground h-14 pr-8 text-right">Ops Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-full">
                      <Server className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-xs italic">No tenants registered in this cluster.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tenants.map(tenant => {
                const planId = tenant.subscription?.planId || "free";
                const isPaid = planId !== "free" && planId !== "demo";
                
                return (
                  <TableRow key={tenant.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-primary/30 transition-colors">
                          <Building className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-black text-white tracking-tight text-base uppercase">{tenant.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[9px] text-muted-foreground/60 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {tenant.id.slice(-8)}</code>
                            <span className="text-[10px] text-muted-foreground font-medium italic lowercase">/{tenant.slug}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className={cn(
                          "w-fit text-[9px] uppercase font-black tracking-widest px-2 py-0.5",
                          tenant.isDemoTenant 
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                            : isPaid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                        )}>
                          {tenant.isDemoTenant ? "Demo Vault" : planId}
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                           <ShieldCheck className="w-3 h-3 text-emerald-500" /> Authorized
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-6">
                         <div className="text-center">
                           <p className="text-sm font-black text-white">{tenant._count.memberships}</p>
                           <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">Staff</p>
                         </div>
                         <div className="w-px h-6 bg-white/5" />
                         <div className="text-center">
                           <p className="text-sm font-black text-white">{tenant._count.products}</p>
                           <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">SKUs</p>
                         </div>
                         <div className="w-px h-6 bg-white/5" />
                         <div className="text-center">
                           <p className="text-sm font-black text-white">{tenant._count.salesInvoices}</p>
                           <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">TXNs</p>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{tenant.createdAt.toLocaleDateString()}</span>
                        <span className="text-[10px] opacity-60">Auto-Scaling V2</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/20 hover:text-primary transition-all group/btn" title="Inspect Ledger">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-500/20 hover:text-blue-400 transition-all group/btn" title="Billing Access">
                          <CreditCard className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-white shadow-sm" title="Internal Preview">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-500/20 text-rose-500/50 hover:text-rose-500 transition-all" title="Terminate Organization">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
