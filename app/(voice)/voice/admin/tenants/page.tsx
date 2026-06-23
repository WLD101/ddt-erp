import { getTenants } from "@/modules/admin-tenants/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import Link from "next/link";
import { TenantSearch } from "./TenantSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Tenant Directory - WhatsQuery",
};

export default async function TenantDirectoryPage(props: {
  searchParams?: Promise<{ search?: string; type?: string }>;
}) {
  await requirePlatformAdmin();
  const searchParams = await props.searchParams;

  const tenants = await getTenants({
    search: searchParams?.search,
    type: searchParams?.type,
  });

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            Tenant Directory
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-primary">apartment</span>
            All Organizations
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage all trial, demo, and production organizations across the platform.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TenantSearch />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Agents</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/voice/admin/tenants/${tenant.id}`} className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {tenant.name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1">{tenant.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      tenant.tenantType === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      tenant.tenantType === "DEMO" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      tenant.tenantType === "TRIAL" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
                      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {tenant.tenantType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      tenant.healthScore >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      tenant.healthScore >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {tenant.healthScore} / 100
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                    {tenant._count?.voiceAgents || 0}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {Number(tenant.walletBalance).toFixed(2)} PKR
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No organizations found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}