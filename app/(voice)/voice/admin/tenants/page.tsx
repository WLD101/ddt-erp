import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminTenantsPage() {
  const tenants = await prisma.voiceBusinessProfile.findMany({
    include: {
      organization: {
        select: { name: true, slug: true },
      },
      _count: {
        select: { voiceAgents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
        <h1 className="text-2xl font-black text-on-surface">Voice Tenants ({tenants.length})</h1>
        <Link href="/admin/command-center" className="text-sm font-bold text-primary hover:underline">
          &larr; Back to Command Center
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((t) => (
          <div key={t.id} className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
            <h2 className="text-lg font-black">{t.organization.name}</h2>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.organization.slug}</p>
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Agents: {t._count.voiceAgents}</span>
              <Link href={`/admin/tenants/${t.organizationId}`} className="text-primary font-bold hover:underline">
                View &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
