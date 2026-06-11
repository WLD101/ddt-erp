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
      callerFacingBusinessName: string;
      internalTrackingName: string;
      phoneTrackingName: string | null;
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
          <h1 className="text-2xl font-black text-on-surface">Voice Command Center</h1>
          <p className="mt-1 text-xs text-on-surface-variant">Master control for your AI receptionist demo flow.</p>
        </div>
        <VoiceStatusPill 
          variant={vapi.callingEnabled ? "online" : "warning"}
          label={vapi.callingEnabled ? "Calling enabled" : "Calling disabled"}
          pulse={vapi.callingEnabled}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-outline-variant/30 bg-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-on-surface">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-center justify-between">
                <span>App</span>
                <VoiceStatusPill variant={system.appStatus === "online" ? "online" : "default"} label={system.appStatus} />
              </li>
              <li className="flex items-center justify-between">
                <span>Database</span>
                <VoiceStatusPill variant={system.dbStatus === "online" ? "online" : "default"} label={system.dbStatus} />
              </li>
              <li className="flex items-center justify-between">
                <span>Voice Engine Keys</span>
                <VoiceStatusPill variant={vapi.hasPrivateKey ? "online" : "error"} label={vapi.hasPrivateKey ? "Ready" : "Missing"} />
              </li>
              <li className="flex items-center justify-between">
                <span>Webhook Secret</span>
                <VoiceStatusPill variant={vapi.hasWebhookSecret ? "online" : "warning"} label={vapi.hasWebhookSecret ? "Secured" : "Recommended"} />
              </li>
              <li className="flex items-center justify-between">
                <span>Last webhook</span>
                <span className="text-xs font-semibold text-on-surface">{system.lastWebhookAt ? new Date(system.lastWebhookAt).toLocaleString() : "No events yet"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Last event type</span>
                <span className="text-xs font-semibold text-on-surface">{system.lastWebhookType || "None"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-on-surface">Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex justify-between"><span>Business Profile</span><span className="font-semibold text-on-surface">{setup.hasProfile ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Receptionist Settings</span><span className="font-semibold text-on-surface">{setup.hasSettings ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Greeting</span><span className="font-semibold text-on-surface">{setup.hasGreeting ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Business Hours</span><span className="font-semibold text-on-surface">{setup.hasBusinessHours ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Services/Menu</span><span className="font-semibold text-on-surface">{setup.hasServices ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Active FAQs</span><span className="font-semibold text-on-surface">{setup.hasFaqs ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Agent Mapping</span><span className="font-semibold text-on-surface">{setup.hasTenantMapping ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Prompt Sync</span><span className="font-semibold text-on-surface">{setup.hasPromptSync ? "Ready" : "Pending"}</span></li>
            </ul>
            <div className="mt-4 rounded-lg bg-primary/10 p-3 text-center text-xs font-black text-primary">
              Training completion: {setup.trainingCompletion}%
            </div>
            <div
              className={`mt-3 rounded-lg p-2 text-center text-xs font-bold ${
                isSetupComplete ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
              }`}
            >
              {isSetupComplete ? "Ready for controlled demo calls" : "Setup incomplete"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-on-surface">Call Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
              <div>Total: <span className="font-bold text-on-surface">{operations.calls.total}</span></div>
              <div>Missed: <span className="font-bold text-on-surface">{operations.calls.missed}</span></div>
              <div>Reservations: <span className="font-bold text-on-surface">{operations.reservations}</span></div>
              <div>Orders: <span className="font-bold text-on-surface">{operations.orders}</span></div>
              <div>Callbacks: <span className="font-bold text-on-surface">{operations.callbacks}</span></div>
            </div>
            <Link href="/voice/dashboard/call-logs" className="mt-4 block text-xs font-bold text-primary hover:underline">
              View call logs →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-on-surface">Leads & Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
              <div>Total leads: <span className="font-bold text-on-surface">{operations.leads.total}</span></div>
              <div>Unresolved: <span className="font-bold text-on-surface">{operations.leads.unresolved}</span></div>
              <div>Active FAQs: <span className="font-bold text-on-surface">{training.activeFaqs}</span></div>
              <div>Services: <span className="font-bold text-on-surface">{training.servicesCount}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link href="/voice/dashboard/leads" className="font-bold text-primary hover:underline">View leads →</Link>
              <Link href="/voice/dashboard/reservations" className="font-bold text-primary hover:underline">Reservation queue →</Link>
              <Link href="/voice/dashboard/orders" className="font-bold text-primary hover:underline">Order queue →</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs">
          <CardHeader>
            <CardTitle className="text-on-surface">Tool Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex justify-between"><span>FAQ lookup</span><span className="font-semibold text-on-surface">{training.toolSummary.faqLookupEnabled ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Business hours</span><span className="font-semibold text-on-surface">{training.toolSummary.businessHoursEnabled ? "Ready" : "Missing"}</span></li>
              <li className="flex justify-between"><span>Booking requests</span><span className="font-semibold text-on-surface">{training.toolSummary.bookingRequestEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Order requests</span><span className="font-semibold text-on-surface">{training.toolSummary.orderRequestEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Human handoff</span><span className="font-semibold text-on-surface">{training.toolSummary.handoffEnabled ? "Ready" : "Disabled"}</span></li>
              <li className="flex justify-between"><span>Callback capture</span><span className="font-semibold text-on-surface">{training.toolSummary.callbackCaptureEnabled ? "Ready" : "Disabled"}</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs md:col-span-2 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-on-surface">Assistant Configuration</CardTitle>
            <VoiceWaveform active={vapi.callingEnabled} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-sm text-on-surface-variant md:grid-cols-4 mt-2">
              <div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Name</div>
                <div className="font-semibold text-on-surface">{assistant.name}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Caller-facing business</div>
                <div className="font-semibold text-on-surface">{assistant.callerFacingBusinessName}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Voice Agent</div>
                <div className="font-semibold text-on-surface">{assistant.voiceAgentName}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Language Mode</div>
                <div className="font-semibold text-on-surface">{assistant.languageMode}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">After Hours</div>
                <div className="font-semibold text-on-surface">{assistant.afterHoursBehavior}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Internal voice tracking name</div>
                <div className="font-semibold text-on-surface">{assistant.internalTrackingName}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Assistant Mapping</div>
                <div className="font-semibold text-on-surface">{assistant.providerAssistantId || "Not mapped yet"}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Phone Number Mapping</div>
                <div className="font-semibold text-on-surface">{assistant.providerPhoneNumberId || "Not mapped yet"}</div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">Phone tracking label</div>
                <div className="font-semibold text-on-surface">{assistant.phoneTrackingName || "Not generated yet"}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/voice/dashboard/settings"
                className="inline-block rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-low"
              >
                Edit settings
              </Link>
              <Link
                href="/voice/dashboard/training"
                className="inline-block rounded-full bg-primary px-4 py-2 text-xs font-black text-on-primary transition hover:bg-primary/95 shadow-sm"
              >
                Open training center
              </Link>
              <Link
                href="/voice/dashboard/integrations/vapi"
                className="inline-block rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-low"
              >
                Engine setup
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface shadow-xs md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-on-surface">Assistant Prompt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              <span>Prompt sync: {training.lastPromptSyncedAt ? new Date(training.lastPromptSyncedAt).toLocaleString() : "Not synced yet"}</span>
              <span>Assistant mapped: {training.assistantMapped ? "Yes" : "No"}</span>
              <span>Phone mapped: {training.phoneMapped ? "Yes" : "No"}</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 font-mono text-xs whitespace-pre-wrap text-on-surface">
              {training.promptPreview}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
