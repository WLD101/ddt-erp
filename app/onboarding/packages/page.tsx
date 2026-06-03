import { redirect } from "next/navigation";
import Link from "next/link";

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

  if (!userWithOrg?.memberships?.length) {
    redirect("/onboarding");
  }

  const org = userWithOrg?.memberships?.[0]?.organization;
  const isDemoOrTrial = org?.isDemoTenant === true || ["demo", "trial"].includes(org?.lifecycleStatus || "");

  let packages: Array<{
    id: string;
    name: string;
    businessSize: string | null;
    userLimit: number;
    featureJson: string;
    isCustom: boolean;
    planId: ReturnType<typeof inferPlanIdFromPackage>;
    availableCycles: {
      monthly: boolean;
      yearly: boolean;
    };
  }> = [];

  try {
    packages = (await getActivePackages()).map((pkg) => {
      const planId = inferPlanIdFromPackage(pkg);
      return {
        id: pkg.id,
        name: pkg.name,
        businessSize: pkg.businessSize,
        userLimit: pkg.userLimit,
        featureJson: typeof pkg.featureJson === "string" ? pkg.featureJson : "{}",
        isCustom: pkg.isCustom,
        planId,
        availableCycles: pkg.isCustom
          ? { monthly: false, yearly: false }
          : getAvailableStripeBillingCycles(planId),
      };
    });
  } catch (error) {
    console.error("[Onboarding Packages] Failed to load active packages", error);
  }

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
      {packages.length > 0 ? (
        <PackageSelectionClient packages={packages} isDemoOrTrial={isDemoOrTrial} />
      ) : (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-8 text-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Packages unavailable</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">We could not load subscription packages right now.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Your workspace is safe, but package data is temporarily unavailable. You can return to the setup flow or ask a platform admin to confirm package availability.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-full bg-indigo-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-indigo-400"
            >
              Back to onboarding
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-indigo-300/40 hover:bg-white/5"
            >
              Return to sign in
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
