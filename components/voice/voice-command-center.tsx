import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceStatusPill } from "./ui/voice-status-pill";
import { VoiceWaveform } from "./ui/voice-waveform";

type VoiceCommandCenterProps = {
  overview: {
    system: {
      appStatus: string;
      dbStatus: string;
      vapiStatus: {
        hasPrivateKey: boolean;
        hasPublicKey: boolean;
        hasWebhookSecret: boolean;
        callingEnabled: boolean;
        webhookUrl?: string | null;
      };
      lastWebhookAt: Date | null;
      lastWebhookType: string | null;
    };
    setup: {
      hasProfile: boolean;
      hasSettings: boolean;
      hasGreeting: boolean;
      hasBusinessHours: boolean;
      hasFallbackContact: boolean;
      hasFaqs: boolean;
      hasTenantMapping: boolean;
      hasServices: boolean;
      hasPromptSync: boolean;
      trainingCompletion: number;
    };
    assistant: {
      name: string;
      languageMode: string;
      greetingMessage: string;
      fallbackMessage: string;
      afterHoursBehavior: string;
      providerAssistantId: string | null;
      providerPhoneNumberId: string | null;
      voiceAgentName: string;
    };
    operations: {
      calls: { total: number; missed: number };
      leads: { total: number; unresolved: number };
      faqs: { total: number; active: number };
      reservations: number;
      orders: number;
      callbacks: number;
    };
    training: {
      checklist: Array<{ label: string; complete: boolean }>;
      servicesCount: number;
      activeFaqs: number;
      lastPromptSyncedAt: Date | null;
      promptPreview: string;
      assistantMapped: boolean;
      phoneMapped: boolean;
      toolSummary: {
        faqLookupEnabled: boolean;
        businessHoursEnabled: boolean;
        bookingRequestEnabled: boolean;
        orderRequestEnabled: boolean;
        handoffEnabled: boolean;
        callbackCaptureEnabled: boolean;
      };
    };
  };
};

export function VoiceCommandCenter({ overview }: VoiceCommandCenterProps) {
  const { system, setup, assistant, operations, training } = overview;
  const vapi = system.vapiStatus;

  const isSetupComplete =
    setup.hasProfile &&
    setup.hasSettings &&
    setup.hasGreeting &&
    setup.hasBusinessHours &&
    setup.hasFaqs &&
    setup.hasTenantMapping &&
    setup.hasServices &&
    vapi.hasPrivateKey &&
    !!assistant.providerAssistantId &&
    !!assistant.providerPhoneNumberId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Voice Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">Master control for your AI receptionist demo flow.</p>
        </div>
        <VoiceStatusPill 
          variant={vapi.callingEnabled ? "online" : "warning"}
          label={vapi.callingEnabled ? "Calling enabled" : "Calling disabled"}
          pulse={vapi.callingEnabled}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between">
                <span>App</span>
                <VoiceStatusPill variant={system.appStatus === "online" ? "online" : "default"} label={system.appStatus} />
              </li>
              <li className="flex items-center justify-between">
                <span>Database</span>
                <VoiceStatusPill variant={system.dbStatus === "online" ? "online" : "default"} label={system.dbStatus} />
              </li>
              <li className="flex items-center justify-between">
                <span>Vapi API Keys</span>
                <VoiceStatusPill variant={vapi.hasPrivateKey ? "online" : "error"} label={vapi.hasPrivateKey ? "Ready" : "Missing"} />
              </li>
              <li className="flex items-center justify-between">
                <span>Webhook Secret</span>
                <VoiceStatusPill variant={vapi.hasWebhookSecret ? "online" : "warning"} label={vapi.hasWebhookSecret ? "Secured" : "Recommended"} />
              </li>
              <li className="flex items-center justify-between">
                <span>Last webhook</span>
                <span className="text-xs">{system.lastWebhookAt ? new Date(system.lastWebhookAt).toLocaleString() : "No events yet"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Last event type</span>
                <span className="text-xs">{system.lastWebhookType || "None"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex justify-between"><span>Business Profile</span><span>{setup.hasProfile ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Receptionist Settings</span><span>{setup.hasSettings ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Greeting</span><span>{setup.hasGreeting ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Business Hours</span><span>{setup.hasBusinessHours ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Services/Menu</span><span>{setup.hasServices ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Active FAQs</span><span>{setup.hasFaqs ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Agent Mapping</span><span>{setup.hasTenantMapping ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Prompt Sync</span><span>{setup.hasPromptSync ? "Ready" : "Pending"}</span></li>
            </ul>
            <div className="mt-4 rounded-lg bg-cyan-400/10 p-3 text-center text-xs font-bold text-cyan-300">
              Training completion: {setup.trainingCompletion}%
            </div>
            <div
              className={`mt-3 rounded-lg p-2 text-center text-xs font-bold ${
                isSetupComplete ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
              }`}
            >
              {isSetupComplete ? "Ready for controlled demo calls" : "Setup incomplete"}
            </div>
          </CardContent>
        </Card>



        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Call Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>Total: <span className="font-bold text-white">{operations.calls.total}</span></div>
              <div>Missed: <span className="font-bold text-white">{operations.calls.missed}</span></div>
              <div>Reservations: <span className="font-bold text-white">{operations.reservations}</span></div>
              <div>Orders: <span className="font-bold text-white">{operations.orders}</span></div>
              <div>Callbacks: <span className="font-bold text-white">{operations.callbacks}</span></div>
            </div>
            <Link href="/voice/dashboard/call-logs" className="mt-4 block text-xs text-cyan-400 hover:text-cyan-300">
              View call logs →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Leads & Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>Total leads: <span className="font-bold text-white">{operations.leads.total}</span></div>
              <div>Unresolved: <span className="font-bold text-white">{operations.leads.unresolved}</span></div>
              <div>Active FAQs: <span className="font-bold text-white">{training.activeFaqs}</span></div>
              <div>Services: <span className="font-bold text-white">{training.servicesCount}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link href="/voice/dashboard/leads" className="text-cyan-400 hover:text-cyan-300">View leads →</Link>
              <Link href="/voice/dashboard/reservations" className="text-cyan-400 hover:text-cyan-300">Reservation queue →</Link>
              <Link href="/voice/dashboard/orders" className="text-cyan-400 hover:text-cyan-300">Order queue →</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Tool Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex justify-between"><span>FAQ lookup</span><span>{training.toolSummary.faqLookupEnabled ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Business hours</span><span>{training.toolSummary.businessHoursEnabled ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Booking requests</span><span>{training.toolSummary.bookingRequestEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Order requests</span><span>{training.toolSummary.orderRequestEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Human handoff</span><span>{training.toolSummary.handoffEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Callback capture</span><span>{training.toolSummary.callbackCaptureEnabled ? "Ready" : "Disabled"}</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35 md:col-span-2 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">Assistant Configuration</CardTitle>
            <VoiceWaveform active={vapi.callingEnabled} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-sm text-slate-300 md:grid-cols-4 mt-2">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Name</div>
                <div className="font-semibold text-white">{assistant.name}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Voice Agent</div>
                <div className="font-semibold text-white">{assistant.voiceAgentName}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Language Mode</div>
                <div className="font-semibold text-white">{assistant.languageMode}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">After Hours</div>
                <div className="font-semibold text-white">{assistant.afterHoursBehavior}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Assistant Mapping</div>
                <div className="font-semibold text-white">{assistant.providerAssistantId || "Not mapped yet"}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Phone Number Mapping</div>
                <div className="font-semibold text-white">{assistant.providerPhoneNumberId || "Not mapped yet"}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/voice/dashboard/settings"
                className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Edit settings
              </Link>
              <Link
                href="/voice/dashboard/training"
                className="inline-block rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
              >
                Open training center
              </Link>
              <Link
                href="/voice/dashboard/integrations/vapi"
                className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-300/40 hover:bg-white/5"
              >
                Vapi setup
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35 md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-white">Assistant Prompt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Prompt sync: {training.lastPromptSyncedAt ? new Date(training.lastPromptSyncedAt).toLocaleString() : "Not synced yet"}</span>
              <span>Assistant mapped: {training.assistantMapped ? "Yes" : "No"}</span>
              <span>Phone mapped: {training.phoneMapped ? "Yes" : "No"}</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto rounded-lg bg-black/50 p-4 font-mono text-xs whitespace-pre-wrap text-slate-300">
              {training.promptPreview}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
