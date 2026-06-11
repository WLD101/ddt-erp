import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { listVoiceAgents } from "@/modules/voice/agents/service";
import { getVoiceTrainingWorkspace } from "@/modules/voice/training/service";
import { getVapiEnvStatus } from "@/modules/voice/vapi/service";
import { VoiceStatusPill } from "@/components/voice/ui/voice-status-pill";
import { VoiceWaveform } from "@/components/voice/ui/voice-waveform";
import { SyncToVapiButton } from "@/components/voice/ui/sync-to-vapi-button";

export default async function VoiceSetupPage() {
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
          <h1 className="text-2xl font-black text-on-surface">Voice Assistant Setup</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Configure your AI receptionist integration for the demo call flow.</p>
        </div>
        <div className="flex items-center gap-4">
          {defaultAgent?.id && (
            <SyncToVapiButton voiceAgentId={defaultAgent.id} isStale={trainingWorkspace.syncState.isPromptStale} />
          )}
          <VoiceWaveform active={vapiStatus.callingEnabled} className="w-16" />
        </div>
      </div>

      <div className="rounded-[28px] border border-amber-500/20 bg-amber-50/50 p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-800">Foundation only</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-900">
          Calling is not considered fully live yet. This page prepares the assistant, webhook, and tenant mapping for a controlled demo only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-8 shadow-soft">
            <h2 className="mb-6 text-lg font-black text-on-surface tracking-tight">Setup Checklist</h2>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li className="flex items-center justify-between"><span>Private Key</span><VoiceStatusPill variant={vapiStatus.hasPrivateKey ? "online" : "error"} label={vapiStatus.hasPrivateKey ? "Ready" : "Missing"} /></li>
              <li className="flex items-center justify-between"><span>Public Key</span><VoiceStatusPill variant={vapiStatus.hasPublicKey ? "online" : "warning"} label={vapiStatus.hasPublicKey ? "Ready" : "Missing"} /></li>
              <li className="flex items-center justify-between"><span>Default Voice Agent</span><span className="font-semibold text-on-surface">{defaultAgent?.name || "Missing"}</span></li>
              <li className="flex items-center justify-between"><span>Agent Assistant ID</span><VoiceStatusPill variant={defaultAgent?.vapiAssistantId ? "online" : "warning"} label={defaultAgent?.vapiAssistantId ? "Configured" : "Missing"} /></li>
              <li className="flex items-center justify-between"><span>Agent Phone Number ID</span><VoiceStatusPill variant={defaultAgent?.vapiPhoneNumberId ? "online" : "warning"} label={defaultAgent?.vapiPhoneNumberId ? "Configured" : "Missing"} /></li>
              <li className="flex items-center justify-between"><span>Webhook Secret</span><VoiceStatusPill variant={vapiStatus.hasWebhookSecret ? "online" : "warning"} label={vapiStatus.hasWebhookSecret ? "Secured" : "Recommended"} /></li>
              <li className="flex items-center justify-between"><span>Live Calling Enabled</span><VoiceStatusPill variant={vapiStatus.callingEnabled ? "online" : "offline"} label={vapiStatus.callingEnabled ? "Enabled" : "Disabled"} pulse={vapiStatus.callingEnabled} /></li>
              <li className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10"><span>Last Webhook</span><span className="text-xs text-on-surface font-semibold">{integration?.lastWebhookAt ? new Date(integration.lastWebhookAt).toLocaleString() : "No events yet"}</span></li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-on-surface">Available Tools</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
              <li>lookup_faq</li>
              <li>get_business_hours</li>
              <li>get_fallback_contact</li>
              <li>capture_lead</li>
              <li>request_appointment</li>
              <li>create_order_request</li>
              <li>summarize_call</li>
              <li>handoff_to_staff</li>
            </ul>
            <p className="mt-4 text-xs text-on-surface-variant/70">
              These tool names must match the tools configured on your voice assistant for the demo flow to save leads and call summaries correctly.
            </p>
          </div>

          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-on-surface">Webhook URL</h2>
            <code className="block rounded bg-surface-container-low p-3 text-xs text-primary font-mono break-all select-all">
              {vapiStatus.webhookUrl || "Configure VAPI_SERVER_URL or VOICE_PUBLIC_APP_URL"}
            </code>
            <p className="mt-3 text-xs text-on-surface-variant/70">
              Calling is still foundation-only until the voice assistant, phone number, webhook secret, and live test calls are all verified.
            </p>
            {!vapiStatus.callingEnabled ? (
              <p className="mt-3 text-xs text-amber-700">
                Calling is currently disabled. Only enable VOICE_CALLING_ENABLED after the assistant and phone number are fully ready.
              </p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-on-surface">Naming and Tracking</h2>
            <div className="space-y-3 text-sm text-on-surface-variant">
              <div className="flex items-center justify-between gap-4">
                <span>Caller-facing business name</span>
                <span className="font-semibold text-on-surface">{trainingWorkspace.runtime.businessIdentity.businessName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Internal assistant name</span>
                <span className="font-semibold text-on-surface">{trainingWorkspace.assistantName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Internal phone label</span>
                <span className="font-semibold text-on-surface">{trainingWorkspace.phoneTrackingName}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-on-surface-variant/70">
              WhatsQuery Voice owns these names and syncs them to the Voice Engine per tenant and per VoiceAgent. Clients should not configure it manually.
            </p>
          </div>

          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-2 text-lg font-black text-on-surface">Use your existing business number</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Don&apos;t want to change your number? You can connect your existing phone number to your new AI Receptionist in 3 simple steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-on-surface-variant ml-2">
              <li>Keep your current number with your provider.</li>
              <li>Set up unconditional call forwarding from your provider&apos;s dashboard to your assigned WhatsQuery AI number.</li>
              <li>The AI receptionist answers all forwarded calls and saves leads, orders, and requests right here in your dashboard.</li>
            </ol>
            <div className="mt-4 pt-4 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface-variant/70">Manage your forwarding numbers and verified status on the <a href="/voice/dashboard/agents" className="text-primary hover:underline font-semibold">Agents page</a>.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-black text-on-surface">Prompt Preview</h2>
          <p className="mb-4 text-xs text-on-surface-variant/70">
            This is the system prompt that will be generated dynamically and sent to the Voice Engine when a call begins.
          </p>
          <div className="max-h-[500px] overflow-y-auto rounded-lg bg-surface-container-low p-4 font-mono text-xs whitespace-pre-wrap text-on-surface-variant leading-6">
            {promptPreview}
          </div>
        </div>
      </div>
    </div>
  );
}
