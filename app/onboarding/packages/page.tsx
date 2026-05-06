import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getActivePackages } from "@/modules/packages/actions";

import { PackageSelectionClient } from "./PackageSelectionClient";

export const dynamic = "force-dynamic";

export default async function PackageSelectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/onboarding/packages");

  const packages = (await getActivePackages()).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    businessSize: pkg.businessSize,
    userLimit: pkg.userLimit,
    featureJson: pkg.featureJson,
    isCustom: pkg.isCustom,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Package selection</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-on-surface">
          Choose how this ERP goes live
        </h1>
        <p className="max-w-2xl text-on-surface-variant">
          Access opens after payment is marked active. Enterprise requests stay pending until a platform admin assigns a custom package.
        </p>
      </section>
      <PackageSelectionClient packages={packages} />
    </div>
  );
}
