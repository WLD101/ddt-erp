import { getTenantById } from "@/modules/admin-tenants/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantStatusControls } from "./TenantStatusControls";

export const metadata = {
  title: "Tenant Details - WhatsQuery",
};

export default async function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const id = (await params).id;

  const tenant = await getTenantById(id);
  if (!tenant) return notFound();

  const activeAgents = (tenant as any).voiceAgents?.length || 0;
  const walletBalance = Number(tenant.walletBalance || 0).toFixed(2);
  const mrr = Number((tenant as any).subscription?.monthlyPrice || 0).toFixed(2);

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/voice/admin/tenants" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              &larr; Back to Directory
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {tenant.name}
            <span className={`text-[12px] uppercase font-bold px-2 py-1 rounded-full ${
              tenant.tenantType === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
              tenant.tenantType === "DEMO" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
              tenant.tenantType === "TRIAL" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
              "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {tenant.tenantType}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">{tenant.slug} • {tenant.email || "No email"}</p>
        </div>
        <div className="flex items-center gap-3">
          <TenantStatusControls tenantId={tenant.id} accessStatus={tenant.accessStatus} lifecycleStatus={tenant.lifecycleStatus} />
          <button className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md shadow-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
            Login As Tenant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Health Score</div>
          <div className={`text-3xl font-bold ${
            (tenant.healthScore || 0) >= 80 ? "text-emerald-600" : (tenant.healthScore || 0) >= 50 ? "text-yellow-500" : "text-rose-500"
          }`}>
            {tenant.healthScore || 0} / 100
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Wallet Balance</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{walletBalance} <span className="text-lg text-slate-400">PKR</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Active Agents</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{activeAgents} <span className="text-lg text-slate-400">/ {(tenant as any).voiceAgents?.length || 0}</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">MRR</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{mrr} <span className="text-lg text-slate-400">PKR</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Call Logs */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Calls</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Cost</th>
                    <th className="px-6 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {((tenant as any).voiceCallLogs || [])?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{log.customerNumber || "Unknown"}</td>
                      <td className="px-6 py-3">{Math.floor((log.durationSeconds || 0) / 60)}m {(log.durationSeconds || 0) % 60}s</td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">{Number(log.cost || 0).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!(tenant as any).voiceCallLogs?.length && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No calls recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Organization Users</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {((tenant as any).members || [])?.map((u: any) => (
                <div key={u.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{u.user?.name || "Unknown"}</div>
                    <div className="text-xs text-slate-500">{u.user?.email}</div>
                  </div>
                </div>
              ))}
              {!(tenant as any).members?.length && (
                <div className="p-4 text-slate-500 text-sm text-center">No users found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
