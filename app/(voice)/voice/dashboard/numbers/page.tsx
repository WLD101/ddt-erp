import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { ensureDefaultCountryProviders } from "@/modules/calls/service";
import { NumberVerificationForm } from "./NumberVerificationForm";

export const dynamic = "force-dynamic";

const countryCards = [
  { country: "Pakistan", dial: "+92", provider: "Pakistan Telco SIP via Asterisk/FreePBX", status: "Available" },
  { country: "USA", dial: "+1", provider: "Twilio Voice/SIP", status: "Available" },
  { country: "UK", dial: "+44", provider: "Twilio Voice/SIP", status: "Available" },
];

export default async function VoiceNumbersPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  await ensureDefaultCountryProviders();

  const numbers = await prisma.phoneNumber.findMany({
    where: { tenantId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      provider: { select: { name: true, type: true, countryCode: true, status: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Telecom Routing</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-on-surface">Phone Numbers</h1>
        <p className="mt-3 max-w-3xl text-sm text-on-surface-variant">
          Manage tenant caller IDs and see which provider will handle Pakistan, USA, and UK calls. Caller ID must be verified before outbound use.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {countryCards.map((card) => (
          <div key={card.dial} className="rounded-3xl border border-outline-variant/40 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-on-surface">{card.country}</p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{card.status}</span>
            </div>
            <p className="mt-3 text-3xl font-black text-primary">{card.dial}</p>
            <p className="mt-2 text-sm text-on-surface-variant">{card.provider}</p>
          </div>
        ))}
      </div>

      <NumberVerificationForm />

      <section className="rounded-3xl border border-outline-variant/40 bg-white shadow-soft">
        <div className="border-b border-outline-variant/40 p-6">
          <h2 className="text-2xl font-black tracking-tight text-on-surface">Verified Numbers</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Tenant-scoped numbers only. No other business numbers are shown here.</p>
        </div>
        {numbers.length === 0 ? (
          <div className="p-8 text-sm text-on-surface-variant">No phone numbers added yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Number</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Caller ID</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((number) => (
                  <tr key={number.id} className="border-t border-outline-variant/30">
                    <td className="px-6 py-4 font-bold text-on-surface">{number.number}</td>
                    <td className="px-6 py-4">{number.countryCode}</td>
                    <td className="px-6 py-4">{number.provider.name}</td>
                    <td className="px-6 py-4 capitalize">{number.type}</td>
                    <td className="px-6 py-4">
                      <span className={number.callerIdAllowed ? "text-emerald-700" : "text-amber-700"}>
                        {number.callerIdAllowed ? "Allowed" : number.verifiedStatus.replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
