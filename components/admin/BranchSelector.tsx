"use client";

import { useState, useTransition } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, Check, Building2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveBranch } from "@/modules/admin/branch-actions";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  code: string | null;
  isMain: boolean;
}

interface BranchSelectorProps {
  branches: Branch[];
  activeBranchId: string;
}

export function BranchSelector({ branches, activeBranchId }: BranchSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  const handleSelect = (id: string) => {
    if (id === activeBranchId) return;
    
    startTransition(async () => {
      try {
        await setActiveBranch(id);
        toast.success(`Switched to ${branches.find(b => b.id === id)?.name}`);
      } catch (error) {
        toast.error("Failed to switch branch");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isPending}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl px-4 flex items-center gap-3 transition-all duration-300 group"
          />
        }
      >
        <div className="p-1 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
          <MapPin className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex flex-col items-start leading-none h-full justify-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary/70">Operational Site</span>
          <span className="font-bold text-sm tracking-tight">{activeBranch?.name || "Global"}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/5 rounded-2xl shadow-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Available Locations
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <div className="space-y-1 mt-1">
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSelect(branch.id)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-all-scroll transition-all group",
                activeBranchId === branch.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                {branch.isMain ? (
                  <Building2 className={cn("w-4 h-4", activeBranchId === branch.id ? "text-white" : "text-primary")} />
                ) : (
                  <Warehouse className={cn("w-4 h-4", activeBranchId === branch.id ? "text-white" : "text-muted-foreground")} />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight">{branch.name}</span>
                  {branch.code && <span className={cn("text-[9px] font-black tracking-widest uppercase opacity-70", activeBranchId === branch.id ? "text-white" : "text-primary")}>{branch.code}</span>}
                </div>
              </div>
              {activeBranchId === branch.id && <Check className="w-4 h-4 text-white" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
