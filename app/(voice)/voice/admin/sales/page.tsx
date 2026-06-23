import { getPipelineLeads, getDemoAccounts } from "@/modules/sales-crm/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { KanbanBoard } from "./KanbanBoard";
import { DemoAccountsTable } from "./DemoAccountsTable";

export const metadata = {
  title: "Sales Command Center - WhatsQuery",
};

export default async function SalesCommandCenterPage() {
  await requirePlatformAdmin();

  // Parallel data fetching
  const [leads, demoAccounts] = await Promise.all([
    getPipelineLeads(),
    getDemoAccounts(),
  ]);

  const stats = {
    totalLeads: leads.length,
    activeDemos: demoAccounts.filter((o) => o.tenantType === "DEMO").length,
    activeTrials: demoAccounts.filter((o) => o.tenantType === "TRIAL").length,
  };

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sales Command Center
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your Leads Pipeline and convert Demo organizations.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-sm font-medium text-slate-500">Total Leads</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalLeads}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-sm font-medium text-slate-500">Active Demos</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.activeDemos}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-sm font-medium text-slate-500">Active Trials</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.activeTrials}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lead Pipeline</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <KanbanBoard initialLeads={leads} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Demo & Trial Accounts</h2>
            </div>
            <div className="p-0 flex-1 overflow-auto max-h-[600px]">
              <DemoAccountsTable accounts={demoAccounts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
