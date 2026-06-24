import { getAgentTemplates } from "@/modules/admin-templates/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Agent Templates - WhatsQuery",
};

export default async function AgentTemplatesPage() {
  await requirePlatformAdmin();
  const templates = await getAgentTemplates();

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="border-none bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
            Library
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agent Templates
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage predefined conversational agents for 1-click onboarding.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/voice/admin/templates/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-blue-700 transition-colors">
              + New Template
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{template.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                    {template.industry}
                  </span>
                  <span className="text-xs text-slate-500">{JSON.parse(template.config || '{}').role || "AI Receptionist"}</span>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                Active
              </Badge>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 flex-1">
              {template.description}
            </p>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <span className="text-xs text-slate-500">Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
              <Link href={`/voice/admin/templates/${template.id}`}>
                <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                  Edit Template &rarr;
                </button>
              </Link>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p className="text-slate-500 text-sm">No templates configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}
