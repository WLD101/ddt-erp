"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { selectPackageAction } from "@/modules/packages/actions";

type PackageItem = {
  id: string;
  name: string;
  businessSize: string | null;
  userLimit: number;
  featureJson: string;
  isCustom: boolean;
};

export function PackageSelectionClient({ packages }: { packages: PackageItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function select(pkg: PackageItem) {
    setPendingId(pkg.id);
    try {
      const result = await selectPackageAction(pkg.isCustom ? { enterprise: true } : { packageId: pkg.id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.status === "enterprise_pending") {
        toast.success("Enterprise request sent. Platform admin will activate your account.");
      } else {
        toast.success("Package selected. Payment is pending.");
      }
      router.push("/settings/billing");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {packages.map((pkg) => (
        <article key={pkg.id} className="rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-soft">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              {pkg.businessSize || "ERP package"}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-on-surface">{pkg.name}</h2>
            <p className="text-sm text-on-surface-variant">
              {pkg.isCustom
                ? "Custom limits and features handled by platform admin."
                : `${pkg.userLimit} users included.`}
            </p>
          </div>
          <Button
            className="mt-6 h-11 w-full rounded-xl font-bold shadow-lg shadow-primary/20"
            onClick={() => select(pkg)}
            disabled={pendingId !== null}
          >
            {pendingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pkg.isCustom ? "Request Enterprise" : "Select Package"}
          </Button>
        </article>
      ))}
    </div>
  );
}

