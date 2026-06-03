import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { listVoiceAgents } from "@/modules/voice/agents/service";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";

export default async function VapiSetupPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const organizationId = ctx.organizationId;

  const vapiStatus = getVapiEnvStatus();
  const [trainingWorkspace, voiceAgents] = await Promise.all([
    getVoiceTrainingWorkspace(organizationId),
    listVoiceAgents(organizationId),
  ]);
  const integration = trainingWorkspace.integrationSettings;
  const promptPreview = trainingWorkspace.promptPreview;
  const defaultAgent = voiceAgents.find((agent) => agent.isDefault) || voiceAgents[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Vapi Assistant Setup</h1>
          <p className="mt-1 text-sm text-slate-400">Configure your AI receptionist integration for the demo call flow.</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-amber-400/30 bg-amber-500/10 p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-200">Foundation only</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
          Calling is not considered fully live yet. This page prepares the assistant, webhook, and tenant mapping for a controlled demo only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
            <h2 className="mb-4 text-lg font-black text-white">Setup Checklist</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex justify-between"><span>Vapi Private Key</span><span>{vapiStatus.hasPrivateKey ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Vapi Public Key</span><span>{vapiStatus.hasPublicKey ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Default Voice Agent</span><span>{defaultAgent?.name || "Missing"}</span></li>
              <li className="flex justify-between"><span>Agent Assistant ID</span><span>{defaultAgent?.vapiAssistantId ? "Configured" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Agent Phone Number ID</span><span>{defaultAgent?.vapiPhoneNumberId ? "Configured" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Webhook Secret</span><span>{vapiStatus.hasWebhookSecret ? "Secured" : "Recommended"}</span></li>
              <li className="flex justify-between"><span>Live Calling Enabled</span><span>{vapiStatus.callingEnabled ? "Yes" : "No"}</span></li>
              <li className="flex justify-between"><span>Agent Assistant Mapping</span><span>{defaultAgent?.vapiAssistantId ? "Mapped" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Agent Phone Mapping</span><span>{defaultAgent?.vapiPhoneNumberId ? "Mapped" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Last Webhook</span><span>{integration?.lastWebhookAt ? new Date(integration.lastWebhookAt).toLocaleString() : "No events yet"}</span></li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
            <h2 className="mb-4 text-lg font-black text-white">Available Tools</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>lookup_faq</li>
              <li>get_business_hours</li>
              <li>get_fallback_contact</li>
              <li>capture_lead</li>
              <li>request_appointment</li>
              <li>create_order_request</li>
              <li>summarize_call</li>
              <li>handoff_to_staff</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              These tool names must match the tools configured on your Vapi assistant for the demo flow to save leads and call summaries correctly.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
            <h2 className="mb-4 text-lg font-black text-white">Webhook URL</h2>
            <code className="block rounded bg-black/50 p-3 text-xs text-amber-200 break-all select-all">
              {vapiStatus.webhookUrl || "Configure VAPI_SERVER_URL or VOICE_PUBLIC_APP_URL"}
            </code>
            <p className="mt-3 text-xs text-slate-400">
              Calling is still foundation-only until the Vapi assistant, phone number, webhook secret, and live test calls are all verified.
            </p>
            {!vapiStatus.callingEnabled ? (
              <p className="mt-3 text-xs text-amber-400">
                Calling is currently disabled. Only enable VOICE_CALLING_ENABLED after the assistant and phone number are fully ready.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
          <h2 className="mb-4 text-lg font-black text-white">Prompt Preview</h2>
          <p className="mb-4 text-xs text-slate-400">
            This is the system prompt that will be generated dynamically and sent to Vapi when a call begins.
          </p>
          <div className="max-h-[500px] overflow-y-auto rounded-lg bg-black/50 p-4 font-mono text-xs whitespace-pre-wrap text-slate-300">
            {promptPreview}
          </div>
        </div>
      </div>
    </div>
  );
}
