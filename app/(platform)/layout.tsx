import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Server, Users, Activity, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// To grant yourself access to this dashboard, your active session email MUST exist in this env string
const SUPER_ADMINS = process.env.SUPER_ADMIN_EMAILS || "";

async function requireSuperAdmin() {
  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase();

  // If unauthenticated or email doesn't strictly match the comma-separated env list, reject.
  if (!userEmail) redirect("/auth/signin");

  const allowedEmails = SUPER_ADMINS.toLowerCase().split(",").map(e => e.trim());
  
  if (!allowedEmails.includes(userEmail)) {
    // Alternatively, we could throw a generic 403. Redirecting to standard dashboard is safest.
    redirect("/");
  }

  return session;
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex">
      {/* Platform Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 flex-shrink-0 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-rose-500">
            <Server className="w-5 h-5" />
            <span className="font-black tracking-widest uppercase text-sm">Platform Ops</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-1.5 flex-1">
          <Link href="/platform" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 hover:text-white text-muted-foreground">
            <BarChart3 className="w-4 h-4" /> Overview
          </Link>
          <Link href="/platform/tenants" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 hover:text-white text-muted-foreground">
            <Users className="w-4 h-4" /> Tenants Directory
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 hover:text-white text-muted-foreground cursor-not-allowed opacity-50">
            <Activity className="w-4 h-4" /> System Health
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5 text-xs text-muted-foreground">
           <p className="font-bold uppercase tracking-widest text-[9px] mb-1 text-white/50">Restricted Zone</p>
           Super-Admin constraints enabled.
        </div>
      </aside>

      {/* Platform Main Pane */}
      <main className="flex-1 overflow-auto bg-[url('/grid-pattern.svg')] bg-repeat">
         <div className="h-full bg-black/50 backdrop-blur-[2px]">
           <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-black/40 backdrop-blur-xl z-50">
             <h1 className="font-bold text-white/80 uppercase tracking-widest text-xs">Global Operator Dashboard</h1>
             <Link href="/" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
               <Settings className="w-3.5 h-3.5" />
               Exit to App
             </Link>
           </header>
           {children}
         </div>
      </main>
    </div>
  );
}
