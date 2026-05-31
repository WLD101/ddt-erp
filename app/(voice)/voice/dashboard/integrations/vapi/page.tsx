import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";
import { buildReceptionistPrompt } from "@/modules/voice/vapi/prompts";
import { prisma } from "@/lib/prisma";

export default async function VapiSetupPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const organizationId = ctx.organizationId;

  const vapiStatus = getVapiEnvStatus();
  
  const profile = await prisma.voiceBusinessProfile.findUnique({ where: { organizationId } });
  const settings = await prisma.voiceReceptionistSettings.findUnique({ where: { organizationId } });
  const kb = await prisma.voiceKnowledgeBaseItem.findMany({ where: { organizationId, isActive: true } });

  const promptPreview = buildReceptionistPrompt(profile, settings, kb);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Vapi Assistant Setup</h1>
          <p className="mt-1 text-sm text-slate-400">Configure your AI receptionist integration</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
            <h2 className="text-lg font-black text-white mb-4">Setup Checklist</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex justify-between">
                <span>Vapi Private Key</span>
                <span>{vapiStatus.hasPrivateKey ? "✅" : "❌"}</span>
              </li>
              <li className="flex justify-between">
                <span>Vapi Public Key</span>
                <span>{vapiStatus.hasPublicKey ? "✅" : "❌"}</span>
              </li>
              <li className="flex justify-between">
                <span>Default Assistant ID</span>
                <span>{vapiStatus.hasDefaultAssistantId ? "✅" : "❌"}</span>
              </li>
              <li className="flex justify-between">
                <span>Default Phone Number ID</span>
                <span>{vapiStatus.hasDefaultPhoneNumberId ? "✅" : "❌"}</span>
              </li>
              <li className="flex justify-between">
                <span>Webhook Secret</span>
                <span>{vapiStatus.hasWebhookSecret ? "🔒 Secured" : "⚠️ Recommended"}</span>
              </li>
              <li className="flex justify-between">
                <span>Live Calling Enabled</span>
                <span>{vapiStatus.callingEnabled ? "🟢 Yes" : "⚫ No"}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
            <h2 className="text-lg font-black text-white mb-4">Available Tools</h2>
            <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
              <li>capture_lead</li>
              <li>request_appointment</li>
              <li>lookup_faq</li>
              <li>get_business_hours</li>
              <li>get_fallback_contact</li>
              <li>summarize_call</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Ensure these tool names map exactly to the tools configured on your Vapi assistant.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
          <h2 className="text-lg font-black text-white mb-4">Prompt Preview</h2>
          <p className="text-xs text-slate-400 mb-4">
            This is the system prompt that will be dynamically generated and sent to Vapi when a call begins.
          </p>
          <div className="bg-black/50 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap">
            {promptPreview}
          </div>
        </div>
      </div>
    </div>
  );
}
