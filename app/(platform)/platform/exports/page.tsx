import { FileDown } from "lucide-react";
import { getPlatformExportRequests } from "@/modules/exports/actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportRequestActions } from "./ExportRequestsClient";

export const dynamic = "force-dynamic";

export default async function PlatformExportsPage() {
  const requests = await getPlatformExportRequests();

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
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No export requests.</TableCell>
              </TableRow>
            ) : requests.map((request) => (
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

