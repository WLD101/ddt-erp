import Link from "next/link";
import { SidebarActiveLink } from "../sidebar-active-link";
import { signOutAction } from "@/modules/auth/actions";
import { CommandPalette } from "../dashboard/CommandPalette";

export function VoiceSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[260px] flex-col justify-between border-r border-white/10 bg-slate-950 shadow-[0_4px_40px_rgba(8,47,73,0.5)] md:flex">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-7 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(21,65,183,0.16),rgba(21,65,183,0.04))] shadow-[0_18px_36px_-22px_rgba(21,65,183,0.6)] ring-1 ring-primary/10">
              <img
                src="/logo-emblem.png"
                alt="WhatsQuery logo"
                width={56}
                height={56}
                draggable={false}
                className="h-14 w-14 rounded-[20px] object-contain drop-shadow-[0_8px_22px_rgba(21,65,183,0.25)]"
              />
            </div>
            <div>
              <h1 className="font-headline-sm text-[1.7rem] font-black leading-none tracking-tight text-on-surface">WhatsQuery</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-primary">Voice AI</p>
            </div>
          </div>
        </div>
        <div className="mt-4 px-4">
          <CommandPalette />
        </div>

        <nav className="mt-6 space-y-1 px-4">
          <SidebarActiveLink href="/dashboard" icon="dashboard" label="Dashboard" />
          <SidebarActiveLink href="/dashboard/command-center" icon="admin_panel_settings" label="Command Center" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300/40">Receptionist</div>
          <SidebarActiveLink href="/dashboard/agents" icon="smart_toy" label="AI Agents" />
          <SidebarActiveLink href="/dashboard/knowledge-base" icon="library_books" label="Knowledge Base" />
          <SidebarActiveLink href="/dashboard/training" icon="model_training" label="Training" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300/40">Activity</div>
          <SidebarActiveLink href="/dashboard/call-logs" icon="call" label="Call Logs" />
          <SidebarActiveLink href="/dashboard/leads" icon="person_add" label="Leads" />
          <SidebarActiveLink href="/dashboard/reservations" icon="event_seat" label="Reservations" />
          <SidebarActiveLink href="/dashboard/orders" icon="shopping_bag" label="Orders" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300/40">System</div>
          <SidebarActiveLink href="/dashboard/integrations" icon="hub" label="Integrations" />
          <SidebarActiveLink href="/dashboard/settings" icon="settings" label="Settings" />
        </nav>
      </div>

      <div className="p-4 bg-slate-950/30 border-t border-white/5">
        <div className="space-y-1">
          <form action={signOutAction}>
            <button 
              type="submit"
              className="w-full flex items-center gap-3 px-5 py-3 text-rose-400 hover:bg-rose-400/5 transition-all duration-300 rounded-xl group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">logout</span>
              <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
