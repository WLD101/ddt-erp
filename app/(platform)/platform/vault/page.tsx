import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/guards";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

function maskCredentialPresence(value?: string | null) {
  return value ? "Encrypted credential present" : "No stored credential";
}

export default async function PlatformVaultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdminPage();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() || "";
  const statusFilter = params.status?.trim() || "all";

  const channels = await prisma.salesChannel.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          country: true,
        },
      },
    },
  });

  const filteredChannels = channels.filter((channel) => {
    const matchesQuery =
      !query ||
      [channel.name, channel.type, channel.organization.name, channel.organization.slug, channel.organization.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "all" || (channel.syncStatus || "unknown") === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const statuses = Array.from(new Set(channels.map((channel) => channel.syncStatus || "unknown")));

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">System vault</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Masked integration credential posture</h1>
        <p className="text-sm text-muted-foreground">
          Provider metadata only. Secrets remain encrypted and are never shown in this admin view.
        </p>
      </section>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.8fr,auto]">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search provider, workspace, slug, or country"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        >
          <option value="all">All sync states</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/vault">Reset</a>
          </Button>
        </div>
      </form>

      <div className="grid gap-4">
        {filteredChannels.length === 0 ? (
          <div className="rounded-3xl border border-outline-variant/30 bg-surface p-8 text-center text-muted-foreground shadow-soft">
            No integration credentials match the current filters.
          </div>
        ) : (
          filteredChannels.map((channel) => (
            <div key={channel.id} className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-black text-on-surface">{channel.name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {channel.organization.name} / {channel.organization.slug} / {channel.type}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  {channel.syncStatus || "unknown"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Credential state</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{maskCredentialPresence(channel.credentialsEncrypted)}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Last sync</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{channel.lastSyncAt ? new Date(channel.lastSyncAt).toLocaleString() : "Never synced"}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Error posture</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{channel.syncError ? "Attention needed" : "No sync error logged"}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
