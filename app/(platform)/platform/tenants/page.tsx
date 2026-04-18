import { getPlatformTenants } from "@/modules/platform/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Server } from "lucide-react";

export default async function PlatformTenantsDirectory() {
  const tenants = await getPlatformTenants();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
            Global <span className="text-primary">Directory</span>
          </h2>
          <p className="text-muted-foreground text-sm">Direct, unrestricted access to all registered databases and workspaces.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-bold tracking-widest uppercase">
          <Server className="w-4 h-4" />
          {tenants.length} Instances
        </div>
      </div>

      <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Workspace Name</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Environment</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Scale</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Created</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No tenants registered.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map(tenant => (
                <TableRow key={tenant.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-white/70" />
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-tight">{tenant.name}</p>
                        <p className="text-[10px] text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.isDemoTenant ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-widest">Demo Vault</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold tracking-widest">Production</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                       <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {tenant._count.memberships}</span>
                       <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {tenant._count.branches}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tenant.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                     {/* Safe placeholder for "Log in as user" or "Force Delete" logic */}
                    <button disabled className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300 opacity-50 cursor-not-allowed">
                       Inspect
                    </button>
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
