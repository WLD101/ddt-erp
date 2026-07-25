import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { resolveExplicitTenantCountry } from "@/modules/countries/policy";
import { getApprovedVapiVoicesForCountry } from "@/modules/voice/vapi/voice-catalog";

export default async function AdminTenantWizardPage({ params }: { params: { id: string } }) {
  await requirePlatformAdmin();

  const organizationId = params.id;
  
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { voiceBusinessProfile: true }
  });

  if (!org) return notFound();
  const tenantCountryCode =
    resolveExplicitTenantCountry({
      country: org.country,
      countryCode: org.countryCode,
      marketKey: org.marketKey,
    }) || null;
  if (!tenantCountryCode) return notFound();
  const approvedVoices = getApprovedVapiVoicesForCountry(tenantCountryCode);

  async function createAgentAction(fd: FormData) {
    "use server"
    await requirePlatformAdmin();

    const name = fd.get("name") as string;
    const role = fd.get("role") as string;
    const voiceId = fd.get("voiceId") as string;
    
    // First ensure business profile exists
    let profile = await prisma.voiceBusinessProfile.findUnique({ where: { organizationId }});
    if (!profile) {
      profile = await prisma.voiceBusinessProfile.create({
        data: {
          organizationId,
          businessName: org?.name || "Business",
          industry: "retail",
          preferredLanguage: "ENGLISH",
          mainGoal: "Customer Service",
        }
      });
    }

    // Create the agent
    await prisma.voiceAgent.create({
      data: {
        organizationId,
        name: name || "Default AI Receptionist",
        displayName: name || "AI Receptionist",
        internalName: (name || "agent").toLowerCase().replace(/\s+/g, '-'),
        role: role || "General Support",
        vapiVoiceId: voiceId || approvedVoices[0]?.voiceId || null,
        isActive: true,
      }
    });

    revalidatePath(`/voice/admin/tenants/${organizationId}`);
    redirect(`/voice/admin/tenants/${organizationId}?tab=agents`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-3xl space-y-8 px-6 pt-8">
        
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface">Receptionist Setup Wizard</h1>
            <p className="text-sm font-medium text-on-surface-variant">Configure {org.name}'s AI Agent</p>
          </div>
          <Link href={`/voice/admin/tenants/${organizationId}`}>
            <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
              &larr; Cancel
            </Button>
          </Link>
        </div>

        <form action={createAgentAction} className="p-8 rounded-[32px] border border-outline-variant/30 bg-surface shadow-xl space-y-6">
           <div className="space-y-4">
             <h2 className="text-xl font-black text-on-surface">1. Agent Profile</h2>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Internal Name</label>
                 <input name="name" required placeholder="e.g. Main Receptionist" defaultValue="Main Receptionist" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Role Context</label>
                 <input name="role" required placeholder="e.g. Front Desk Assistant" defaultValue="Front Desk Assistant" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary" />
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Vapi Voice ID</label>
               <select name="voiceId" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary">
                 {approvedVoices.map((voice) => (
                   <option key={voice.voiceId} value={voice.voiceId}>{voice.displayName} ({voice.locale})</option>
                 ))}
               </select>
               <p className="text-xs text-on-surface-variant">Only country-approved voices are available for this tenant.</p>
             </div>
           </div>

           <div className="pt-6 border-t border-outline-variant/20">
             <h2 className="text-xl font-black text-on-surface mb-2">2. Business Profile</h2>
             <p className="text-sm text-on-surface-variant mb-4">If the tenant does not have a business profile, a default one will be created.</p>
           </div>
           
           <div className="pt-6 border-t border-outline-variant/20">
             <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-on-primary text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
               Create Receptionist
             </Button>
             <p className="text-xs text-center text-on-surface-variant mt-4">After creation, you can sync the prompt to Vapi and assign a phone number from the agent overview.</p>
           </div>
        </form>

      </div>
    </div>
  );
}
