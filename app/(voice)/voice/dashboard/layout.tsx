import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { VoiceDashboardShell } from "@/components/voice/voice-dashboard-shell";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Business profile, launch readiness, and live status once telephony is connected.",
  },
  {
    label: "Call Logs",
    href: "/dashboard/call-logs",
    description: "Inbound calls, outcomes, transcripts, escalation flags, and future quality review.",
  },
  {
    label: "Knowledge Base",
    href: "/dashboard/knowledge-base",
    description: "Business FAQs, service menus, policy notes, and answer boundaries for the receptionist.",
  },
  {
    label: "Leads & Appointments",
    href: "/dashboard/leads",
    description: "Captured callers, follow-ups, booking requests, and handoff destinations.",
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    description: "Provider placeholders for Vapi, Twilio, calendars, CRM, and future webhooks.",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    description: "Business profile, receptionist tone, office hours, consent prompts, and routing defaults.",
  },
];

export default async function VoiceDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const host = await getVoiceRequestHost();

  if (!session?.user?.id) {
    redirect(toVoiceExternalPath("/login", host));
  }

  return (
    <VoiceDashboardShell
      title="Receptionist Workspace"
      description="This dashboard is the standalone operating shell for WhatsQuery Voice. It is intentionally separated from ERP assistant actions and reserved for call handling, business scripts, caller data, and telephony setup."
      homeHref={toVoiceExternalPath("/", host)}
      navItems={navItems.map((item) => ({
        ...item,
        href: toVoiceExternalPath(item.href, host),
      }))}
    >
      {children}
    </VoiceDashboardShell>
  );
}
