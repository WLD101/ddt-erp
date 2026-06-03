import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminAgentsPage() {
  const agents = await prisma.voiceAgent.findMany({
    include: {
      organization: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
        <h1 className="text-2xl font-black text-on-surface">Voice Agents ({agents.length})</h1>
        <Link href="/admin/command-center" className="text-sm font-bold text-primary hover:underline">
          &larr; Back to Command Center
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-lowest text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 border-b border-outline-variant/20">Name</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Organization</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Role</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Vapi Assistant</th>
              <th className="px-4 py-3 border-b border-outline-variant/20">Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50">
                <td className="px-4 py-3 font-bold text-on-surface">
                  {a.name}
                  {a.isDefault && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>}
                </td>
                <td className="px-4 py-3">{a.organization.name}</td>
                <td className="px-4 py-3">{a.role}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.vapiAssistantId || "Not mapped"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${a.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-error/10 text-error"}`}>
                    {a.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
