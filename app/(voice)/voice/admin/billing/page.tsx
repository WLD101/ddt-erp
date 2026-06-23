import { getCostLedgerStats } from "@/modules/admin-billing/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Billing & Ledger - WhatsQuery",
};

export default async function BillingLedgerPage() {
  await requirePlatformAdmin();
  const stats = await getCostLedgerStats();

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="border-none bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
            Ledger & Billing
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-emerald-600">account_balance</span>
            Financial Command Center
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Monitor real-time platform profitability, provider costs, and subscription margins.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Provider Costs</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">${stats.totalProviderCost.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Billed to Tenants</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">${stats.totalTenantBilled.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 z-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Gross Profit</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">${stats.grossProfit.toFixed(2)}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Profit Margin</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Ledger Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4 text-right">Cost (USD)</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {stats.recentEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{entry.id.slice(-8)}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {entry.tenantId}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {entry.service}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{entry.provider}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                    ${Number(entry.amount || 0).toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {stats.recentEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No ledger entries found. Cost tracking begins upon first completed call.
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
