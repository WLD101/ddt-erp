import { LifeBuoy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformSupportRequests, updateSupportRequestStatus } from "@/modules/support/actions";
import { SUPPORT_REASONS } from "@/modules/support/schema";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  type?: string;
}>;

function statusTone(status: string) {
  if (status === "OPEN") return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  if (status === "IN_PROGRESS") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "RESOLVED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  return "border-outline-variant/40 text-on-surface-variant";
}

function priorityTone(priority: string) {
  if (priority === "URGENT") return "border-error/30 bg-error/10 text-error";
  if (priority === "HIGH") return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  return "border-outline-variant/40 text-on-surface-variant";
}

function reasonLabel(value?: string | null) {
  return SUPPORT_REASONS.find((reason) => reason.value === value)?.label || value || "Not specified";
}

export default async function PlatformSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requests = await getPlatformSupportRequests();
  const query = params.q?.trim().toLowerCase() || "";
  const status = params.status || "all";
  const type = params.type || "all";

  const filtered = requests.filter((request) => {
    const matchesStatus = status === "all" || request.status === status;
    const matchesType = type === "all" || request.type === type;
    const haystack = [
      request.organization.name,
      request.organization.slug,
      request.requestedBy.email,
      request.requestedBy.name,
      request.subject,
      request.description,
      request.reason,
      request.sourcePage,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && matchesType && (!query || haystack.includes(query));
  });

  const openCount = requests.filter((request) => request.status === "OPEN").length;
  const liveCount = requests.filter((request) => request.type === "LIVE_SUPPORT" && request.status !== "CLOSED").length;
  const ticketCount = requests.filter((request) => request.type === "TICKET" && request.status !== "CLOSED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <LifeBuoy className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Tenant Support Inbox</p>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Support command center</h1>
        <p className="text-sm text-muted-foreground">
          Live support requests and tenant tickets are automatically linked to the organization that raised them.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Open Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black text-on-surface">{openCount}</CardContent>
        </Card>
        <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Live Support</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black text-primary">{liveCount}</CardContent>
        </Card>
        <Card className="rounded-3xl border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-black text-secondary">{ticketCount}</CardContent>
        </Card>
      </section>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.7fr,0.7fr,auto]">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search tenant, requester, subject, reason, or page"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <select name="status" defaultValue={status} className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none">
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select name="type" defaultValue={type} className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none">
          <option value="all">All types</option>
          <option value="LIVE_SUPPORT">Live support</option>
          <option value="TICKET">Tickets</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/support">Reset</a>
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead>Tenant</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Admin Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No support requests match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((request) => (
                <TableRow key={request.id} className="align-top border-outline-variant/30">
                  <TableCell>
                    <div className="font-black text-on-surface">{request.organization.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{request.organization.email || request.organization.slug}</div>
                    <div className="mt-2">
                      <Badge variant="outline" className="border-outline-variant/40 text-[10px] uppercase tracking-wider text-on-surface-variant">
                        {request.organization.tenantType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={request.type === "LIVE_SUPPORT" ? "border-primary/30 bg-primary/10 text-primary" : "border-secondary/30 bg-secondary/10 text-secondary"}>
                        {request.type === "LIVE_SUPPORT" ? "Live support" : "Ticket"}
                      </Badge>
                      <Badge variant="outline" className={priorityTone(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                    <div className="mt-3 font-bold text-on-surface">{request.subject}</div>
                    <div className="mt-1 text-xs font-semibold text-on-surface-variant">{reasonLabel(request.reason)}</div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
                    {request.sourcePage && <div className="mt-2 text-xs text-primary">Source: {request.sourcePage}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-on-surface">{request.requestedBy.name || "Unnamed user"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{request.requestedBy.email || "No email"}</div>
                    {request.contactPhone && <div className="mt-1 text-xs text-muted-foreground">{request.contactPhone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(request.status)}>
                      {request.status.replaceAll("_", " ")}
                    </Badge>
                    {request.adminNotes && <p className="mt-2 max-w-[180px] text-xs leading-5 text-muted-foreground">{request.adminNotes}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.createdAt.toLocaleString()}</TableCell>
                  <TableCell className="min-w-[220px] text-right">
                    <form action={updateSupportRequestStatus} className="space-y-2">
                      <input type="hidden" name="id" value={request.id} />
                      <select
                        name="status"
                        defaultValue={request.status}
                        className="h-9 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-xs text-on-surface outline-none"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <textarea
                        name="adminNotes"
                        defaultValue={request.adminNotes || ""}
                        placeholder="Internal admin note"
                        className="min-h-[70px] w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none"
                      />
                      <Button type="submit" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
