"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createPackageAction, deactivatePackageAction } from "@/modules/packages/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_ORDER, PLANS } from "@/lib/billing/plans";

const defaultForm = {
  name: "",
  businessSize: "",
  monthlyPrice: "",
  branchLimit: "",
  userLimit: "10",
  modules: "",
  isCustom: false,
};

export function PackageAdminClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);

  function fillFromPlan(planId: (typeof PLAN_ORDER)[number]) {
    const plan = PLANS[planId];
    setForm({
      name: plan.name,
      businessSize: plan.audience,
      monthlyPrice: plan.price.monthly ? String(plan.price.monthly) : "",
      branchLimit: String(plan.limits.maxBranches),
      userLimit: String(plan.limits.maxUsers),
      modules: plan.includedModules.join(", "),
      isCustom: plan.id === "enterprise",
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const featureJson = JSON.stringify({
        monthlyPrice: form.monthlyPrice ? Number(form.monthlyPrice) : null,
        currency: "PKR",
        displayPrice: form.monthlyPrice ? `Rs. ${Number(form.monthlyPrice).toLocaleString()}/month` : "Custom",
        branchLimit: form.branchLimit ? Number(form.branchLimit) : null,
        modules: form.modules
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      const result = await createPackageAction({
        name: form.name,
        businessSize: form.businessSize,
        userLimit: Number(form.userLimit),
        featureJson,
        isCustom: form.isCustom,
      });

      if (!result.success) {
        toast.error(String("error" in result ? result.error : "Failed to create package"));
        return;
      }

      toast.success("Package created.");
      setForm(defaultForm);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-outline-variant/30 bg-surface/40 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-on-surface">Create or clone a package</h2>
          <p className="text-sm text-muted-foreground">Use a standard package as a starting point, then adjust details only if you need a custom offer.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PLAN_ORDER.map((planId) => (
            <Button
              key={planId}
              type="button"
              variant="outline"
              className="border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
              onClick={() => fillFromPlan(planId)}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Load {PLANS[planId].name}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-2">
          <Label className="text-on-surface-variant">Name</Label>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="border-outline-variant/30 bg-surface/30 text-on-surface" required />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface-variant">Audience</Label>
          <Input value={form.businessSize} onChange={(event) => setForm({ ...form, businessSize: event.target.value })} className="border-outline-variant/30 bg-surface/30 text-on-surface" />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface-variant">Monthly price</Label>
          <Input value={form.monthlyPrice} onChange={(event) => setForm({ ...form, monthlyPrice: event.target.value })} type="number" min={0} className="border-outline-variant/30 bg-surface/30 text-on-surface" placeholder="Leave blank for custom" />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface-variant">Branch limit</Label>
          <Input value={form.branchLimit} onChange={(event) => setForm({ ...form, branchLimit: event.target.value })} type="number" min={1} className="border-outline-variant/30 bg-surface/30 text-on-surface" placeholder="Unlimited if blank" />
        </div>
        <div className="space-y-2">
          <Label className="text-on-surface-variant">User limit</Label>
          <Input value={form.userLimit} onChange={(event) => setForm({ ...form, userLimit: event.target.value })} type="number" min={1} className="border-outline-variant/30 bg-surface/30 text-on-surface" required />
        </div>
        <label className="flex items-end gap-2 pb-3 text-sm text-on-surface-variant">
          <input type="checkbox" checked={form.isCustom} onChange={(event) => setForm({ ...form, isCustom: event.target.checked })} />
          Mark as custom
        </label>
        <div className="space-y-2 md:col-span-2 xl:col-span-5">
          <Label className="text-on-surface-variant">Highlights</Label>
          <Input
            value={form.modules}
            onChange={(event) => setForm({ ...form, modules: event.target.value })}
            className="border-outline-variant/30 bg-surface/30 text-on-surface"
            placeholder="Customers, Inventory, Daraz integration, CSV import"
          />
        </div>
        <Button className="self-end" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create
        </Button>
      </form>
    </div>
  );
}

export function DeactivatePackageButton({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function click() {
    setIsLoading(true);
    try {
      const result = await deactivatePackageAction(id);
      if (!result.success) {
        toast.error(String("error" in result ? result.error : "Failed to deactivate package"));
        return;
      }
      toast.success("Package deactivated.");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={click} disabled={isLoading} className="text-rose-400 hover:text-rose-300">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Deactivate
    </Button>
  );
}

