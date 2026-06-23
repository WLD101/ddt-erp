import { getPartners } from "@/modules/admin-partners/actions";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = {
  title: "Partner Portal - WhatsQuery",
};

export default async function PartnerPortalPage() {
  await requirePlatformAdmin();
  const partners = await getPartners();

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="border-none bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
            White-Label & Resellers
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-orange-600">handshake</span>
            Partner Directory
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage agency partners, manage API keys, and monitor white-label tenant deployments.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/voice/admin/partners/new">
            <button className="bg-orange-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-orange-700 transition-colors">
              + Add Partner
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Agency / Partner</th>
                <th className="px-6 py-4">API Key</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Referred Tenants</th>
                <th className="px-6 py-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{partner.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{partner.contactEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-[10px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2">
                      <span>{partner.apiKey.slice(0, 12)}••••••••••••</span>
                      <button className="hover:text-slate-900 dark:hover:text-white" title="Copy to clipboard">
                        <span className="material-symbols-outlined text-[12px]">content_copy</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={partner.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"}>
                      {partner.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {Number(partner.commissionRate || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-full text-xs">
                      {partner.referrals?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs">
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No agency partners enrolled yet.
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
