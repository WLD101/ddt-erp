import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { inferPlanIdFromPackage } from "@/lib/billing/catalog";
import { getAvailableStripeBillingCycles } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { getActivePackages } from "@/modules/packages/actions";

import { PackageSelectionClient } from "./PackageSelectionClient";

export const dynamic = "force-dynamic";

export default async function PackageSelectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/onboarding/packages");

  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        take: 1,
        include: {
          organization: {
            select: {
              isDemoTenant: true,
              lifecycleStatus: true,
            },
          },
        },
      },
    },
  });

  const org = userWithOrg?.memberships?.[0]?.organization;
  const isDemoOrTrial = org?.isDemoTenant === true || ["demo", "trial"].includes(org?.lifecycleStatus || "");

  const packages = (await getActivePackages()).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    businessSize: pkg.businessSize,
    userLimit: pkg.userLimit,
    featureJson: pkg.featureJson,
    isCustom: pkg.isCustom,
    planId: inferPlanIdFromPackage(pkg),
    availableCycles: pkg.isCustom
      ? { monthly: false, yearly: false }
      : getAvailableStripeBillingCycles(inferPlanIdFromPackage(pkg)),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-16 md:py-20">
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">Package selection</p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
          Choose how this ERP goes live
        </h1>
        <p className="max-w-2xl text-slate-400">
          {isDemoOrTrial 
            ? "Choose your preferred starting plan to unlock onboarding. You will not be charged during the trial."
            : "Standard plans continue into secure Stripe checkout. Enterprise requests stay pending until a platform admin assigns a custom package."}
        </p>
      </section>
      <PackageSelectionClient packages={packages} isDemoOrTrial={isDemoOrTrial} />
    </div>
  );
}
