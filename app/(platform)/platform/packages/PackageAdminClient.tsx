"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPackageAction, deactivatePackageAction } from "@/modules/packages/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PackageAdminClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    businessSize: "",
    userLimit: "10",
    featureJson: '{"exportData":true,"advancedReports":true,"auditLogs":true}',
    isCustom: false,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await createPackageAction({
        ...form,
        userLimit: Number(form.userLimit),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Package created.");
      setForm({ name: "", businessSize: "", userLimit: "10", featureJson: '{"exportData":true,"advancedReports":true,"auditLogs":true}', isCustom: false });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-white/10 bg-black/40 p-5 md:grid-cols-5">
      <div className="space-y-2">
        <Label className="text-white/70">Name</Label>
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="border-white/10 bg-black/30 text-white" required />
      </div>
      <div className="space-y-2">
        <Label className="text-white/70">Business size</Label>
        <Input value={form.businessSize} onChange={(event) => setForm({ ...form, businessSize: event.target.value })} className="border-white/10 bg-black/30 text-white" />
      </div>
      <div className="space-y-2">
        <Label className="text-white/70">User limit</Label>
        <Input value={form.userLimit} onChange={(event) => setForm({ ...form, userLimit: event.target.value })} type="number" min={1} className="border-white/10 bg-black/30 text-white" required />
      </div>
      <label className="flex items-end gap-2 pb-3 text-sm text-white/70">
        <input type="checkbox" checked={form.isCustom} onChange={(event) => setForm({ ...form, isCustom: event.target.checked })} />
        Custom package
      </label>
      <Button className="self-end" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Create
      </Button>
    </form>
  );
}

export function DeactivatePackageButton({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function click() {
    setIsLoading(true);
    try {
      const result = await deactivatePackageAction(id);
      if (result.error) {
        toast.error(result.error);
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
