import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VoiceCommandCenter({ overview }: { overview: any }) {
  const { system, setup, assistant, operations } = overview;
  const vapi = system.vapiStatus;

  const isSetupComplete = 
    setup.hasProfile && 
    setup.hasSettings && 
    setup.hasGreeting && 
    setup.hasBusinessHours && 
    setup.hasFaqs && 
    vapi.hasPrivateKey && 
    vapi.hasDefaultAssistantId && 
    vapi.hasDefaultPhoneNumberId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Voice Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">Master control for your AI receptionist</p>
        </div>
        <div className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] ${vapi.callingEnabled ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'}`}>
          {vapi.callingEnabled ? "CALLING LIVE" : "CALLING DISABLED"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* System Status */}
        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex justify-between"><span>Database:</span> <span className="text-emerald-400">{system.dbStatus}</span></li>
              <li className="flex justify-between"><span>Vapi API Keys:</span> <span>{vapi.hasPrivateKey ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Webhook Secret:</span> <span>{vapi.hasWebhookSecret ? "🔒 Secured" : "⚠️ Recommended"}</span></li>
            </ul>
          </CardContent>
        </Card>

        {/* Readiness Checklist */}
        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex justify-between"><span>Business Profile:</span> <span>{setup.hasProfile ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Receptionist Settings:</span> <span>{setup.hasSettings ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Greeting Configured:</span> <span>{setup.hasGreeting ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Business Hours:</span> <span>{setup.hasBusinessHours ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Active FAQs:</span> <span>{setup.hasFaqs ? "✅" : "❌"}</span></li>
              <li className="flex justify-between"><span>Vapi Configured:</span> <span>{vapi.hasDefaultAssistantId ? "✅" : "❌"}</span></li>
            </ul>
            <div className={`mt-4 rounded-lg p-2 text-center text-xs font-bold ${isSetupComplete ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
              {isSetupComplete ? "Ready for Live Calls" : "Setup Incomplete"}
            </div>
          </CardContent>
        </Card>

        {/* Safety / Tenant Isolation Panel */}
        <Card className="border-amber-400/30 bg-amber-500/10 xl:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-amber-200">Security & Isolation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-amber-100/80">
              <li>✔️ Dashboard strictly protected</li>
              <li>✔️ All data strictly tenant-scoped</li>
              <li>✔️ Calls isolated to current business</li>
              <li>✔️ No public logs or transcripts</li>
              <li>✔️ Independent from ERP system</li>
            </ul>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Call Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-slate-300">
              <div>Total: <span className="text-white font-bold">{operations.calls.total}</span></div>
              <div>Missed: <span className="text-white font-bold">{operations.calls.missed}</span></div>
            </div>
            <Link href="/voice/dashboard/call-logs" className="mt-4 block text-xs text-cyan-400 hover:text-cyan-300">View Call Logs →</Link>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-slate-300">
              <div>Total: <span className="text-white font-bold">{operations.leads.total}</span></div>
              <div>Unresolved: <span className="text-white font-bold">{operations.leads.unresolved}</span></div>
            </div>
            <Link href="/voice/dashboard/leads" className="mt-4 block text-xs text-cyan-400 hover:text-cyan-300">View Leads →</Link>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/35">
          <CardHeader>
            <CardTitle className="text-white">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-slate-300">
              <div>Total FAQs: <span className="text-white font-bold">{operations.faqs.total}</span></div>
              <div>Active FAQs: <span className="text-white font-bold">{operations.faqs.active}</span></div>
            </div>
            <Link href="/voice/dashboard/knowledge-base" className="mt-4 block text-xs text-cyan-400 hover:text-cyan-300">Manage FAQs →</Link>
          </CardContent>
        </Card>

        {/* Assistant Configuration */}
        <Card className="border-white/10 bg-slate-950/35 md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-white">Assistant Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</div>
                <div className="font-semibold text-white">{assistant.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Language Mode</div>
                <div className="font-semibold text-white">{assistant.languageMode}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">After Hours</div>
                <div className="font-semibold text-white">{assistant.afterHoursBehavior}</div>
              </div>
            </div>
            <Link href="/voice/dashboard/settings" className="mt-6 inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Edit Settings
            </Link>
            <Link href="/voice/dashboard/integrations/vapi" className="mt-6 ml-3 inline-block bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Vapi Setup
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
