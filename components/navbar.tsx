import { auth } from "@/lib/auth";
import { UserButton } from "./user-button";
import { getBranches } from "@/modules/admin/branch-actions";
import { BranchSelector } from "./admin/BranchSelector";
import { NotificationBell } from "./notifications/NotificationBell";
import { getCurrentTenantContext } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./dashboard/CommandPalette";

export async function Navbar() {
  const session = await auth();
  
  let role = "USER";
  let activeBranchId = "";
  let branches: any[] = [];

  try {
    const ctx = await getCurrentTenantContext();
    role = ctx.role;
    activeBranchId = ctx.branchId;
    branches = await getBranches();
  } catch (e) {
    // Context may fail on first visit or unlinked users
  }

  return (
    <header className="flex items-center justify-between px-8 sticky top-0 z-30 bg-white/80 backdrop-blur-xl h-20 border-b border-outline-variant/30 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-lg hidden md:block">
          <CommandPalette />
        </div>
        {branches.length > 0 && (
          <div className="ml-2">
            <BranchSelector branches={branches} activeBranchId={activeBranchId} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <NavActionIcon icon="event_note" />
          <NotificationBell />
          <NavActionIcon icon="help_center" />
        </div>
        
        <div className="h-8 w-px bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-on-surface tracking-tight leading-none">
              {session?.user?.name || "Neural Operator"}
            </p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5 opacity-60">
              {role || "Admin"} Node
            </p>
          </div>
          <div className="p-1 rounded-2xl border border-outline-variant/30 bg-white shadow-soft">
            <UserButton user={{
              name: session?.user?.name,
              email: session?.user?.email,
              image: session?.user?.image,
              role: role
            }} />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavActionIcon({ icon }: { icon: string }) {
  return (
    <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/10">
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </button>
  );
}
