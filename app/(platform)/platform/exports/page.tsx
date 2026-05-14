import { FileDown } from "lucide-react";
import { getPlatformExportRequests } from "@/modules/exports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportRequestActions } from "./ExportRequestsClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

export default async function PlatformExportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requests = await getPlatformExportRequests();
  const query = params.q?.trim().toLowerCase() || "";
  const statusFilter = params.status?.trim() || "all";
  const filteredRequests = requests.filter((request) => {
    const matchesQuery =
      !query ||
      [request.organization.name, request.requestedBy.email, request.scope, request.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <FileDown className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Export approvals</p>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Controlled data export</h1>
        <p className="text-sm text-muted-foreground">Tenant exports require platform approval and short-lived download tokens.</p>
      </section>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.8fr,auto]">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search organization, requester, scope, or status"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DOWNLOADED">Downloaded</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/exports">Reset</a>
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface/40">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead>Organization</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No export requests.</TableCell>
              </TableRow>
            ) : filteredRequests.map((request) => (
              <TableRow key={request.id} className="border-outline-variant/30">
                <TableCell className="font-bold text-on-surface">{request.organization.name}</TableCell>
                <TableCell className="text-muted-foreground">{request.requestedBy.email}</TableCell>
                <TableCell>{request.scope}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={request.status === "PENDING" ? "border-amber-500/30 text-amber-400" : request.status === "APPROVED" ? "border-emerald-500/30 text-emerald-400" : "border-outline-variant/50 text-muted-foreground"}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{request.createdAt.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{request.status === "PENDING" ? <ExportRequestActions id={request.id} /> : null}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

