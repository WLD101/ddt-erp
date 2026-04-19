import { getBranches } from "@/modules/admin/branch-actions";
import { BranchForm } from "@/components/admin/BranchForm";
import { 
  Building2, 
  MapPin, 
  Warehouse, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default async function BranchesPage() {
  const branches = await getBranches();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Operational <span className="text-primary">Sites</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mt-1">
            Manage your organization's physical footprint. Every site operates as a dedicated inventory and profit center.
          </p>
        </div>

        <Dialog>
          <DialogTrigger
            render={
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-3 group" />
            }
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Establish New Site
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900/95 backdrop-blur-2xl border-white/5 rounded-3xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Warehouse className="w-6 h-6 text-primary" />
                </div>
                Establish Branch
              </DialogTitle>
            </DialogHeader>
            <BranchForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className="group relative bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 shadow-xl">
                  {branch.isMain ? (
                    <Building2 className="w-6 h-6 text-primary" />
                  ) : (
                    <Warehouse className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                {branch.isMain && (
                  <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black tracking-widest uppercase py-1 px-3 rounded-full">
                    Headquarters
                  </Badge>
                )}
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black tracking-tight text-white group-hover:text-primary transition-colors">
                  {branch.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{branch.code || "No Code"}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1 text-muted-foreground italic text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{branch.address || "Digital Location"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4 opacity-70" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Site</span>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary/10 hover:text-primary rounded-xl flex items-center gap-2 group/btn">
                  Manage Site
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder for "Add Branch" visual cue */}
        <Dialog>
          <DialogTrigger
            render={
              <button className="h-full min-h-[280px] border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 group" />
            }
          >
            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white tracking-tight">Expand Operations</p>
              <p className="text-xs text-muted-foreground mt-1">Add another physical location</p>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900/95 backdrop-blur-2xl border-white/5 rounded-3xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Warehouse className="w-6 h-6 text-primary" />
                </div>
                Establish Branch
              </DialogTitle>
            </DialogHeader>
            <BranchForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
