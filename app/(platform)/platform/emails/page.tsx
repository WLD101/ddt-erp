import { AlertCircle, Mail, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/guards";

type SearchParams = Promise<{
  q?: string;
  event?: string;
  page?: string;
}>;

const PAGE_SIZE = 20;

function matchesSearch(log: Awaited<ReturnType<typeof loadEmailLogs>>[number], query: string) {
  const haystack = [log.event, log.subject, log.providerId, log.user?.name, log.user?.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

async function loadEmailLogs() {
  return prisma.emailLog.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 250,
  });
}

export default async function PlatformEmailsDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdminPage();
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const eventFilter = params.event?.trim() || "all";
  const page = Math.max(1, Number(params.page || "1") || 1);

  let logs: Awaited<ReturnType<typeof loadEmailLogs>> = [];
  let loadError = false;

  try {
    logs = await loadEmailLogs();
  } catch (error) {
    loadError = true;
    console.error("[platform-emails] failed to load email logs", error);
  }

  const events = Array.from(new Set(logs.map((log) => log.event))).sort((left, right) => left.localeCompare(right));
  const filteredLogs = logs.filter((log) => {
    const matchesEvent = eventFilter === "all" || log.event === eventFilter;
    const matches = !query || matchesSearch(log, query);
    return matchesEvent && matches;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Mail className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Platform emails</p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Lifecycle delivery intelligence</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Monitor outbound lifecycle and onboarding email activity without exposing provider internals or framework errors.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" />
            {filteredLogs.length} matching emails
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Total tracked</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{logs.length}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Unique events</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{events.length}</p>
        </div>
        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Zap className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">Page safety</p>
          <p className="mt-2 text-sm font-bold text-on-surface">{loadError ? "Fallback mode active" : "Live data loaded"}</p>
        </div>
      </section>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.7fr,auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search recipient, subject, provider id, or event"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <select
          name="event"
          defaultValue={eventFilter}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        >
          <option value="all">All events</option>
          {events.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/emails">Reset</a>
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead>Event</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Provider ID</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                    <p className="font-bold text-on-surface">We couldn't load platform emails right now.</p>
                    <p className="max-w-xl text-sm text-on-surface-variant">
                      Please refresh the page. Internal error details were logged server-side for support follow-up.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                  No platform emails match the current filters yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id} className="border-outline-variant/30">
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                      {log.event}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-on-surface">{log.user?.name || "Unknown user"}</p>
                      <p className="text-xs text-on-surface-variant">{log.user?.email || "No email"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-on-surface-variant">{log.subject || "No subject"}</TableCell>
                  <TableCell className="text-xs font-mono text-on-surface-variant">{log.providerId || "N/A"}</TableCell>
                  <TableCell className="text-xs text-on-surface-variant">{new Date(log.sentAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loadError && totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-3xl border border-outline-variant/30 bg-surface p-4 shadow-soft">
          <p className="text-sm text-on-surface-variant">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-2xl"
              disabled={currentPage <= 1}
            >
              <a href={`/platform/emails?q=${encodeURIComponent(query)}&event=${encodeURIComponent(eventFilter)}&page=${Math.max(1, currentPage - 1)}`}>
                Previous
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl"
              disabled={currentPage >= totalPages}
            >
              <a href={`/platform/emails?q=${encodeURIComponent(query)}&event=${encodeURIComponent(eventFilter)}&page=${Math.min(totalPages, currentPage + 1)}`}>
                Next
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
