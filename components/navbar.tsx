import { Settings, UserCircle, LogOut, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { UserButton } from "./user-button";
import { getBranches } from "@/modules/admin/branch-actions";
import { BranchSelector } from "./admin/BranchSelector";
import { NotificationBell } from "./notifications/NotificationBell";
import { getCurrentTenantContext } from "@/lib/tenant";

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
    <header className="h-20 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <h1 className="font-black text-xl hidden sm:block tracking-tighter uppercase italic text-white/90">
          Nexus<span className="text-primary italic">ERP</span>
        </h1>
        {branches.length > 0 && (
          <div className="border-l border-white/10 pl-8">
            <BranchSelector branches={branches} activeBranchId={activeBranchId} />
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-6">
        <NotificationBell />
        <Link href="/help" className="hover:bg-primary/20 hover:text-primary transition-all duration-300 p-2 rounded-md">
          <HelpCircle className="w-5 h-5 text-muted-foreground transition-colors" />
        </Link>
        <Link href="/settings" className="hover:bg-primary/20 hover:text-primary transition-all duration-300 p-2 rounded-md">
          <Settings className="w-5 h-5 text-muted-foreground transition-colors" />
        </Link>
        <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold leading-none text-foreground">
              {session?.user?.name || "User"}
            </span>
            <span className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
              {role}
            </span>
          </div>
          <UserButton user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
            role: role
          }} />
        </div>
      </div>
    </header>
  );
}
