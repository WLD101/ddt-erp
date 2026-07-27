import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SidebarActiveLink } from "../sidebar-active-link";
import { signOutAction } from "@/modules/auth/actions";
import { CommandPalette } from "../dashboard/CommandPalette";

export function VoiceSidebar({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[260px] flex-col justify-between border-r border-outline-variant/30 bg-white shadow-soft md:flex">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-7 py-8">
          <div className="flex items-start">
            <Logo variant="compact" size="sm" subtitle="VOICE AI" />
          </div>
        </div>


        <nav className="mt-6 space-y-1 px-4">
          <SidebarActiveLink href="/dashboard" icon="dashboard" label="Dashboard" />
          {isAdmin && (
            <SidebarActiveLink href="/dashboard/command-center" icon="admin_panel_settings" label="Command Center" />
          )}
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">Receptionist</div>
          <SidebarActiveLink href="/dashboard/agents" icon="smart_toy" label="AI Agents" />
          <SidebarActiveLink href="/dashboard/knowledge-base" icon="library_books" label="Knowledge Base" />
          <SidebarActiveLink href="/dashboard/training" icon="model_training" label="Training" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">Activity</div>
          <SidebarActiveLink href="/dashboard/whatsapp/inbox" icon="chat" label="WhatsApp Inbox" />
          <SidebarActiveLink href="/dashboard/call-logs" icon="call" label="Call Logs" />
          <SidebarActiveLink href="/dashboard/review" icon="fact_check" label="Review Inbox" />
          <SidebarActiveLink href="/dashboard/numbers" icon="settings_phone" label="Phone Numbers" />
          <SidebarActiveLink href="/dashboard/leads" icon="person_add" label="Leads" />
          <SidebarActiveLink href="/dashboard/reservations" icon="event_seat" label="Reservations" />
          <SidebarActiveLink href="/dashboard/orders" icon="shopping_bag" label="Orders" />
          
          <div className="pt-6 pb-2 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">System</div>
          <SidebarActiveLink href="/dashboard/integrations" icon="hub" label="Integrations" />
          <SidebarActiveLink href="/dashboard/settings" icon="settings" label="Settings" />
        </nav>
      </div>

      <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/10">
        <div className="space-y-1">
          <form action={signOutAction}>
            <button 
              type="submit"
              className="w-full flex items-center gap-3 px-5 py-3 text-error hover:bg-error/5 transition-all duration-300 rounded-xl group"
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
