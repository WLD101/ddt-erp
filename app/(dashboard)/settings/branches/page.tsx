import { getBranches } from "@/modules/admin/branch-actions";
import { BranchForm } from "@/components/admin/BranchForm";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function BranchesPage() {
  const branches = await getBranches();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Operational <span className="text-primary">Sites</span>
          </h2>
          <p className="text-on-surface-variant text-sm font-medium max-w-md mt-1 font-body-md">
            Manage your organization's physical footprint. Every site operates as a dedicated inventory and profit node.
          </p>
        </div>

        <Dialog>
          <DialogTrigger className="h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-on-primary font-semibold flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] mr-2">add_location</span>
            Establish New Site
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-3xl p-8 border-outline-variant/30">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3 font-headline-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-[24px]">warehouse</span>
                </div>
                Establish Branch
              </DialogTitle>
            </DialogHeader>
            <BranchForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className="group relative bg-surface border border-outline-variant/30 rounded-3xl p-8 hover:shadow-lg transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
            
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 bg-surface-container flex items-center justify-center rounded-2xl border border-outline-variant/20 shadow-sm">
                  {branch.isMain ? (
                    <span className="material-symbols-outlined text-primary text-[24px]">corporate_fare</span>
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-[24px]">home_work</span>
                  )}
                </div>
                {branch.isMain && (
                  <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black tracking-widest uppercase py-1 px-3 rounded-lg">
                    Headquarters
                  </Badge>
                )}
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black tracking-tight text-on-surface group-hover:text-primary transition-colors font-headline-sm">
                  {branch.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{branch.code || "NO_CODE"}</span>
                  <div className="w-1 h-1 rounded-full bg-outline-variant" />
                  <div className="flex items-center gap-1 text-on-surface-variant italic text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{branch.address || "Cloud Managed"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[16px] animate-pulse">verified_user</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Site</span>
                </div>
                <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary/10 hover:text-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  Configure
                  <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <Dialog>
          <DialogTrigger className="h-full min-h-[280px] border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 group shadow-sm bg-surface/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-3xl group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 border border-outline-variant/20">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[32px]">add_business</span>
            </div>
            <div className="text-center">
              <p className="font-black text-on-surface tracking-tight font-headline-sm">Expand Grid</p>
              <p className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-widest opacity-60 italic">Register physical asset</p>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-3xl p-8 border-outline-variant/30">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3 font-headline-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-[24px]">warehouse</span>
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
