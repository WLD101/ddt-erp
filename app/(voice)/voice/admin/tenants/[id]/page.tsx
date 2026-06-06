import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";

const shellCardClassName = "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

export default async function AdminTenantVoicePage({ params, searchParams }: { params: { id: string }, searchParams: { tab?: string } }) {
  const organizationId = params.id;
  const currentTab = searchParams.tab || "overview";

  const [org, agents, integration, packages] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: { 
        voiceBusinessProfile: true,
        organizationPackage: { include: { package: true } },
        subscription: true
      },
    }),
    prisma.voiceAgent.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.voiceIntegrationSettings.findUnique({
      where: { organizationId },
    }),
    prisma.package.findMany({
      where: { productType: "VOICE", isActive: true }
    })
  ]);

  if (!org) return notFound();

  const agentWorkspaces = await Promise.all(
    agents.map((agent) => getVoiceTrainingWorkspace(organizationId, { voiceAgentId: agent.id })),
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "agents", label: "AI Receptionist" },
    { id: "billing", label: "Package & Billing" }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-5xl space-y-8 px-6 pt-8">
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/20 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-on-surface">{org.name}</h1>
              <Badge variant="outline" className={org.accessStatus === "active" ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"}>
                {org.accessStatus}
              </Badge>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Manage AI receptionist, usage limits, and Voice billing for {org.slug}.</p>
          </div>
          <Link href="/voice/admin/tenants">
            <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
              &larr; All Tenants
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-outline-variant/20 pb-4">
          {tabs.map(tab => (
            <Link key={tab.id} href={`/voice/admin/tenants/${organizationId}?tab=${tab.id}`}>
              <Badge 
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest cursor-pointer ${currentTab === tab.id ? "bg-primary text-on-primary shadow-md" : "bg-surface border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
              >
                {tab.label}
              </Badge>
            </Link>
          ))}
        </div>

        {currentTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
             <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 border-b border-outline-variant/20 pb-2">Business Profile</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Name</span><span className="font-bold">{org.voiceBusinessProfile?.businessName || "Not set"}</span></div>
                 <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Phone</span><span className="font-bold">{org.voiceBusinessProfile?.businessPhone || "Not set"}</span></div>
                 <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Language</span><span className="font-bold">{org.voiceBusinessProfile?.preferredLanguage || "Not set"}</span></div>
               </div>
             </div>
             
             <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 border-b border-outline-variant/20 pb-2">Integration</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">WhatsApp</span><span className="font-bold">{integration?.whatsappNotificationsEnabled ? "Enabled" : "Disabled"}</span></div>
                 <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Staff Phone</span><span className="font-bold">{integration?.staffWhatsAppNumber || "Not set"}</span></div>
               </div>
             </div>
          </div>
        )}

        {currentTab === "agents" && (
          <div className="space-y-6">
             {agents.length === 0 ? (
               <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm text-center py-12">
                 <p className="text-sm font-medium text-on-surface-variant mb-4">No AI Receptionist created yet.</p>
                 <Link href={`/voice/admin/tenants/${organizationId}/wizard`}>
                   <Button className="h-10 rounded-xl bg-primary text-on-primary text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
                     Create Receptionist Wizard &rarr;
                   </Button>
                 </Link>
               </div>
             ) : (
               agents.map((agent, index) => {
                 const workspace = agentWorkspaces[index];
                 return (
                   <div key={agent.id} className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm">
                     <div className="flex justify-between items-start mb-6 border-b border-outline-variant/20 pb-4">
                       <div>
                         <h3 className="text-xl font-black text-on-surface">{agent.displayName || agent.name}</h3>
                         <p className="text-xs font-bold text-primary mt-1">{agent.role}</p>
                       </div>
                       <Badge variant="outline" className={agent.isActive ? "border-emerald-500/30 text-emerald-500" : "border-outline-variant/50 text-on-surface-variant"}>
                         {agent.isActive ? "Active" : "Disabled"}
                       </Badge>
                     </div>
                     <div className="grid gap-6 md:grid-cols-2">
                       <div className="space-y-4 text-sm">
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Vapi Assistant ID</span>
                           <span className="font-medium bg-surface-container p-2 rounded-xl border border-outline-variant/30">{agent.vapiAssistantId || "None"}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Vapi Phone ID</span>
                           <span className="font-medium bg-surface-container p-2 rounded-xl border border-outline-variant/30">{agent.vapiPhoneNumberId || "None"}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                           <span className="text-xs font-medium text-on-surface-variant">Forwarding</span>
                           <Badge variant="outline" className={agent.forwardingStatus === "VERIFIED" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}>
                             {agent.forwardingStatus || "PENDING"}
                           </Badge>
                         </div>
                       </div>
                       
                       <div className="space-y-4 text-sm">
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Prompt Sync</span>
                           <span className={`font-medium ${workspace.syncState.isPromptStale ? "text-amber-500" : "text-emerald-500"}`}>
                             {workspace.syncState.isPromptStale ? "Stale (needs sync)" : "Up to date"}
                           </span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Client Number (Public)</span>
                           <span className="font-medium bg-surface-container p-2 rounded-xl border border-outline-variant/30">{agent.clientPublicPhoneNumber || "None"}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">AI Number (Internal)</span>
                           <span className="font-medium bg-surface-container p-2 rounded-xl border border-outline-variant/30">{agent.assignedVapiPhoneNumber || "None"}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )
               })
             )}
          </div>
        )}

        {currentTab === "billing" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 border-b border-outline-variant/20 pb-2">Assigned Package</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Package</span><span className="font-bold">{org.organizationPackage?.package?.name || "None"}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Status</span><span className="font-bold">{org.subscription?.status || "None"}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Payment Method</span><span className="font-bold">{org.subscription?.manualPaymentMethod || org.subscription?.billingSource || "Manual"}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-on-surface-variant">Stripe Customer</span><span className="font-bold truncate max-w-[150px]">{org.subscription?.stripeCustomerId || "Unlinked"}</span></div>
              </div>
            </div>

            <form action={async (fd: FormData) => {
               "use server"
               const pkgId = fd.get("packageId") as string;
               const status = fd.get("status") as string;
               // server action placeholder to manually save voice package logic
            }} className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 border-b border-outline-variant/20 pb-2">Manual Assignment Override</h3>
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase">Assign Package</label>
                 <select name="packageId" defaultValue={org.organizationPackage?.packageId || ""} className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none">
                   <option value="">No Package</option>
                   {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase">Subscription Status</label>
                 <select name="status" defaultValue={org.subscription?.status || "active"} className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none">
                   <option value="active">Active</option>
                   <option value="trialing">Trialing</option>
                   <option value="past_due">Past Due</option>
                   <option value="suspended">Suspended</option>
                 </select>
               </div>
               <Button type="submit" className="w-full h-10 rounded-xl bg-primary text-on-primary text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
                 Save Override
               </Button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
