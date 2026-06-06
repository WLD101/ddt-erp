import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { deleteVoicePackageAction } from "./actions";

export const dynamic = "force-dynamic";

const shellCardClassName = "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

export default async function VoicePackagesPage() {
  const packages = await prisma.package.findMany({
    where: { productType: "VOICE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                Voice Platform
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-[32px] text-primary">inventory_2</span>
                Packages
              </h1>
              <p className="text-sm text-on-surface-variant max-w-2xl">
                Manage subscription packages for the Voice product, define feature limits, and map Stripe products.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/voice/admin/command-center">
                <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
                  &larr; Command Center
                </Button>
              </Link>
              <Link href="/voice/admin/packages/new">
                <Button className="h-10 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                  <span className="material-symbols-outlined mr-2 text-[16px]">add</span>
                  Create Package
                </Button>
              </Link>
            </div>
          </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const meta = JSON.parse(pkg.featureJson || "{}");
            return (
              <Card key={pkg.id} className={`${shellCardClassName} flex flex-col`}>
                <CardHeader className="border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight">{pkg.name}</CardTitle>
                      <p className="text-sm font-medium text-on-surface-variant mt-1">/{meta.slug || "no-slug"}</p>
                    </div>
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black">${meta.monthlyPrice || 0}</span>
                    <span className="text-sm font-medium text-on-surface-variant"> / mo</span>
                    {meta.originalMonthlyPrice && meta.originalMonthlyPrice > meta.monthlyPrice && (
                      <span className="ml-2 text-sm text-on-surface-variant line-through">${meta.originalMonthlyPrice}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-6 py-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-sm text-on-surface-variant line-clamp-2">{meta.description || "No description provided."}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
                        <span className="block text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Agents</span>
                        <span className="font-bold">{meta.maxAgents || "Unlimited"}</span>
                      </div>
                      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
                        <span className="block text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Mins/mo</span>
                        <span className="font-bold">{meta.maxMonthlyMinutes || "Unlimited"}</span>
                      </div>
                      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
                        <span className="block text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Numbers</span>
                        <span className="font-bold">{meta.maxPhoneNumbers || "Unlimited"}</span>
                      </div>
                      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2">
                        <span className="block text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Trial</span>
                        <span className="font-bold">{meta.trialDays ? `${meta.trialDays} days` : "None"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-outline-variant/10">
                    <Link href={`/voice/admin/packages/${pkg.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full h-10 rounded-xl border-outline-variant/40 text-[11px] font-black uppercase tracking-wider">
                        Edit
                      </Button>
                    </Link>
                    <form action={deleteVoicePackageAction}>
                      <input type="hidden" name="id" value={pkg.id} />
                      <Button type="submit" variant="destructive" className="h-10 w-10 p-0 rounded-xl">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
        
        {packages.length === 0 && (
          <div className="rounded-[32px] border border-outline-variant/30 bg-surface-container-lowest p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50">inventory_2</span>
            <h3 className="mt-4 text-lg font-black text-on-surface">No packages found</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Create your first voice package to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
