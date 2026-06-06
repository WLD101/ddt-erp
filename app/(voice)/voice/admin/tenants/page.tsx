import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(value?: Date | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString();
}

export default async function AdminTenantsPage() {
  const tenants = await prisma.voiceBusinessProfile.findMany({
    include: {
      organization: {
        include: {
          organizationPackage: { include: { package: true } },
          subscription: true
        }
      },
      _count: {
        select: { voiceAgents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                Voice Tenants
              </Badge>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">apartment</span>
                  Tenant Management
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Manage business profiles, assign Voice packages, and configure AI receptionists.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/voice/admin/command-center">
                <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
                  &larr; Command Center
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((t) => (
            <div key={t.id} className="p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-sm transition-transform hover:-translate-y-1">
              <h2 className="text-xl font-black text-on-surface">{t.organization.name}</h2>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{t.organization.slug}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-outline-variant/10 pb-2">
                  <span className="text-on-surface-variant font-medium">Status</span>
                  <Badge variant="outline" className={t.organization.accessStatus === "active" ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"}>
                    {t.organization.accessStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-outline-variant/10 pb-2">
                  <span className="text-on-surface-variant font-medium">Package</span>
                  <span className="font-bold text-on-surface">{t.organization.organizationPackage?.package?.name || "None"}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-outline-variant/10 pb-2">
                  <span className="text-on-surface-variant font-medium">AI Agents</span>
                  <span className="font-bold text-on-surface">{t._count.voiceAgents}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Link href={`/voice/admin/tenants/${t.organizationId}`}>
                  <Button className="w-full h-10 rounded-xl bg-primary text-on-primary text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
                    Manage Tenant &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}