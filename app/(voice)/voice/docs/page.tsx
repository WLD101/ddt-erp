import Link from "next/link";

import { VoiceMarketingShell } from "@/components/voice/voice-marketing-shell";
import { VoiceLocalizedPricingNote, LocalizedVoicePrice } from "@/components/voice/voice-localized-pricing";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

const docSections = [
  { id: "introduction", label: "Introduction" },
  { id: "quickstart", label: "Quickstart" },
  { id: "how-it-works", label: "How it works" },
  { id: "knowledge-base", label: "Knowledge base" },
  { id: "routing", label: "Routing" },
  { id: "integrations", label: "Integrations" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "next-steps", label: "Next steps" },
];

export default async function VoiceDocsPage() {
  const host = await getVoiceRequestHost();
  const homeHref = toVoiceExternalPath("/", host);
  const loginHref = toVoiceExternalPath("/login", host);
  const onboardingHref = toVoiceExternalPath("/onboarding", host);
  const pricingHref = toVoiceExternalPath("/pricing", host);
  const docsHref = toVoiceExternalPath("/docs", host);

  return (
    <VoiceMarketingShell
      homeHref={homeHref}
      loginHref={loginHref}
      onboardingHref={onboardingHref}
      pricingHref={pricingHref}
      docsHref={docsHref}
    >
      <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
          <aside className="lg:sticky lg:top-24 self-start rounded-[28px] border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#21D4FD]">Voice Docs</p>
            <nav className="mt-5 space-y-2 text-sm">
              {docSections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-2xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="space-y-12 rounded-[32px] border border-white/10 bg-slate-950/40 p-6 md:p-10">
            <section className="space-y-5 border-b border-white/10 pb-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#21D4FD]">Get started</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">WhatsQuery Voice Docs</h1>
              <p className="max-w-3xl text-base leading-8 text-slate-300">
                These docs explain exactly how WhatsQuery Voice answers calls, qualifies customers, routes outcomes, and syncs everything back into your business systems. The goal is simple: make it obvious to a buyer what they are getting and how quickly they can go live.
              </p>
            </section>

            <section id="introduction" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Introduction</h2>
              <p className="leading-8 text-slate-300">
                WhatsQuery Voice is an AI receptionist built for businesses that live on inbound calls. It answers instantly, speaks naturally, captures intent, qualifies leads, books appointments, and updates the right workflow after every conversation.
              </p>
              <p className="leading-8 text-slate-300">
                This is not just a voice bot. It is designed to replace missed calls, reduce manual admin, and help your team see every call outcome clearly inside the dashboard.
              </p>
            </section>

            <section id="quickstart" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Quickstart</h2>
              <ol className="space-y-3 text-slate-300">
                <li>1. Create your voice workspace and define your business identity, greeting, hours, and escalation rules.</li>
                <li>2. Add your FAQs, pricing points, services, and booking information so the agent can answer with confidence.</li>
                <li>3. Connect your phone number or forwarding flow.</li>
                <li>4. Test calls in the dashboard before going live.</li>
                <li>5. Launch and watch call logs, leads, appointments, and summaries appear in the voice dashboard.</li>
              </ol>
            </section>

            <section id="how-it-works" className="space-y-4">
              <h2 className="text-3xl font-black text-white">How it works</h2>
              <p className="leading-8 text-slate-300">
                Every incoming call follows a structured loop. The caller speaks, the system transcribes intent, the agent decides what to say based on your training data and rules, and the outcome is written back to the relevant dashboard area.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Answer within seconds and greet the caller in the right tone.",
                  "Understand the reason for the call and extract useful details.",
                  "Book, route, summarize, or escalate based on your business logic.",
                  "Sync lead, order, appointment, or support details after the call ends.",
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section id="knowledge-base" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Knowledge base</h2>
              <p className="leading-8 text-slate-300">
                Your knowledge base controls how useful the receptionist is. Add business information, pricing details, booking rules, refund policy, common objections, operating hours, and anything your team repeats every day.
              </p>
              <p className="leading-8 text-slate-300">
                The clearer your docs are, the better your agent handles real questions without guessing.
              </p>
            </section>

            <section id="routing" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Routing</h2>
              <p className="leading-8 text-slate-300">
                Routing decides what happens after the agent understands the caller. You can send leads to sales, hand off urgent calls, create support cases, trigger bookings, or move the result into the right dashboard queue.
              </p>
              <ul className="space-y-3 text-slate-300">
                <li>Lead capture for sales and callbacks</li>
                <li>Appointment and reservation scheduling</li>
                <li>Support triage and escalation</li>
                <li>After-hours message capture and follow-up</li>
              </ul>
            </section>

            <section id="integrations" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Integrations</h2>
              <p className="leading-8 text-slate-300">
                WhatsQuery Voice is built to work with your broader operating system. It can feed summaries, bookings, leads, and call outcomes into your ERP workflows so your team does not have to manually re-enter information after every conversation.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {["ERP sync", "Call logs", "Knowledge base", "Lead capture", "Reservations", "Support queues"].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm font-semibold text-white">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section id="pricing" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Pricing</h2>
              <VoiceLocalizedPricingNote className="text-sm text-slate-400" />
              <div className="grid gap-5 lg:grid-cols-3">
                {[
                  {
                    name: "Starter",
                    prices: { PKR: 15000, USD: 54, GBP: 43, EUR: 49, AED: 199 } as const,
                    copy: "For small businesses starting with AI call coverage.",
                  },
                  {
                    name: "Growth",
                    prices: { PKR: 35000, USD: 125, GBP: 99, EUR: 114, AED: 469 } as const,
                    copy: "For growing teams that need more volume and more language coverage.",
                  },
                  {
                    name: "Pro",
                    prices: { PKR: 55000, USD: 197, GBP: 157, EUR: 179, AED: 729 } as const,
                    copy: "For advanced teams with premium voice, analytics, and support needs.",
                  },
                ].map((plan) => (
                  <div key={plan.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="mt-2 min-h-[48px] text-sm leading-7 text-slate-300">{plan.copy}</p>
                    <div className="mt-5">
                      <LocalizedVoicePrice
                        prices={plan.prices}
                        amountClassName="text-3xl font-black text-white"
                        periodClassName="mt-1 text-sm text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="faq" className="space-y-4">
              <h2 className="text-3xl font-black text-white">FAQ</h2>
              <div className="space-y-4">
                {[
                  ["Can it answer after hours?", "Yes. You can run 24/7 coverage and decide what happens during business hours, after hours, and weekends."],
                  ["Can it book appointments?", "Yes. You can configure booking flows, capacity rules, and what details must be captured before confirmation."],
                  ["Can it escalate to a human?", "Yes. Escalation rules can hand off urgent callers, create tasks, or send callback requests to the right team."],
                  ["Can it speak multiple languages?", "Yes. The current marketing page already supports multilingual positioning, and packages include multi-language options."],
                ].map(([question, answer]) => (
                  <div key={question} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-base font-black text-white">{question}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="next-steps" className="space-y-4">
              <h2 className="text-3xl font-black text-white">Next steps</h2>
              <p className="leading-8 text-slate-300">
                If you want to see the platform in action, start the onboarding flow or review pricing in more detail before speaking with the team.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={onboardingHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#21D4FD] px-6 py-3 text-sm font-black text-[#050816] shadow-lg shadow-[#21D4FD]/20 hover:scale-[1.03] transition-all"
                >
                  Start setup
                </Link>
                <Link
                  href={pricingHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
                >
                  View pricing
                </Link>
              </div>
            </section>
          </article>

          <aside className="hidden lg:block lg:sticky lg:top-24 self-start rounded-[28px] border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#21D4FD]">On this page</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {docSections.map((section) => (
                <Link key={section.id} href={`#${section.id}`} className="block transition hover:text-white">
                  {section.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </VoiceMarketingShell>
  );
}
