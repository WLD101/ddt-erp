import { getKnowledgeBases } from "@/modules/admin-knowledge/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Global Knowledge Base - WhatsQuery",
};

export default async function KnowledgeBasePage() {
  await requirePlatformAdmin();
  const kbs = await getKnowledgeBases();

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="border-none bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
            System Memory
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Global Knowledge Base
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage global reference documents available to all conversational agents.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/voice/admin/knowledge/new">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-purple-700 transition-colors">
              + New Knowledge Base
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Knowledge Base</th>
                <th className="px-6 py-4">Documents</th>
                <th className="px-6 py-4">Scope</th>
                <th className="px-6 py-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {kbs.map((kb) => (
                <tr key={kb.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/voice/admin/knowledge/${kb.id}`} className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {kb.name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{kb.description || "No description"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-full text-xs">
                      {kb._count.documents} files
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={kb.isGlobal ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}>
                      {kb.isGlobal ? "Global" : "Tenant Specific"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs">
                    {new Date(kb.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {kbs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No knowledge bases have been created yet.
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
