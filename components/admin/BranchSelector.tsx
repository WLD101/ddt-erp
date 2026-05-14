"use client";

import { useTransition } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  const hasMultipleBranches = branches.length > 1;

  const handleSelect = (id: string) => {
    if (!hasMultipleBranches || id === activeBranchId) return;
    
    startTransition(async () => {
      try {
        await setActiveBranch(id);
        toast.success(`Switched to ${branches.find(b => b.id === id)?.name}`);
      } catch (error) {
        toast.error("Failed to switch branch");
      }
    });
  };

  const triggerContent = (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-[20px]">store</span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-outline mb-0.5">Location</span>
        <span className="font-bold text-sm text-on-surface">{activeBranch?.name || "Main Branch"}</span>
      </div>
      {hasMultipleBranches ? (
        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">expand_more</span>
      ) : (
        <span className="rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
          Fixed
        </span>
      )}
    </div>
  );

  if (!hasMultipleBranches) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-4 flex items-center gap-3 shadow-sm h-10 disabled:opacity-100"
      >
        {triggerContent}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isPending}
            className="bg-surface-container-low border border-outline-variant hover:bg-surface-container text-on-surface rounded-lg px-4 flex items-center gap-3 transition-all shadow-sm group h-10"
          />
        }
      >
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-surface border border-outline-variant rounded-xl shadow-soft p-2">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Switch Location
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-outline-variant/30" />
        <div className="space-y-1 mt-1">
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSelect(branch.id)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group",
                activeBranchId === branch.id 
                  ? "bg-primary-container/20 text-primary" 
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">
                  {branch.isMain ? "business" : "warehouse"}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{branch.name}</span>
                  {branch.code && <span className="text-[9px] font-bold tracking-widest uppercase opacity-70">{branch.code}</span>}
                </div>
              </div>
              {activeBranchId === branch.id && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
