import { approveDemoRequestAction, getPlatformLeads, rejectDemoRequestAction } from "@/modules/leads/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Target, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  source?: string;
  page?: string;
}>;

const PAGE_SIZE = 20;

export default async function PlatformLeadsDirectory({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const leads = await getPlatformLeads();
  const query = params.q?.trim().toLowerCase() || "";
  const statusFilter = params.status?.trim() || "all";
  const sourceFilter = params.source?.trim() || "all";
  const filteredLeads = leads.filter((lead) => {
    const effectiveStatus = lead.demoStatus && lead.demoStatus !== "NONE" ? lead.demoStatus : lead.status;
    const matchesQuery =
      !query ||
      [lead.name, lead.email, lead.organizationName, lead.businessName, lead.country, lead.companySize]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesQuery && matchesStatus && matchesSource;
  });
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(params.page || "1") || 1), totalPages);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-on-surface flex items-center gap-3">
            Lead <span className="text-primary">Intelligence</span>
          </h2>
          <p className="text-muted-foreground text-sm">Monitor and manage high-intent demo requests and inbound inquiries.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-bold tracking-widest uppercase">
          <Target className="w-4 h-4" />
          {filteredLeads.length} Matching Leads
        </div>
      </div>

      <form className="grid gap-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-soft md:grid-cols-[1.2fr,0.8fr,0.8fr,auto]">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search person, company, email, country, or company size"
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        >
          <option value="all">All statuses</option>
          <option value="NEW">New</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="VERIFIED_PENDING">Verified pending</option>
          <option value="ACTIVATED">Activated</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          name="source"
          defaultValue={sourceFilter}
          className="h-11 rounded-2xl border border-outline-variant bg-surface-container px-4 text-sm text-on-surface outline-none"
        >
          <option value="all">All sources</option>
          <option value="DEMO">Demo</option>
          <option value="CONTACT">Contact</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            Apply
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]">
            <a href="/platform/leads">Reset</a>
          </Button>
        </div>
      </form>

      <div className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface/40 backdrop-blur-xl shadow-2xl">
        <Table>
          <TableHeader className="bg-surface/[0.02]">
            <TableRow className="border-outline-variant/20 hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Source</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Lead Info</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Company</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Created</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  No leads captured yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow key={lead.id} className="border-outline-variant/20 hover:bg-surface/[0.02] transition-colors group">
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                      lead.source === "DEMO" ? "bg-primary/10 text-primary border-primary/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-on-surface-variant/50" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface tracking-tight">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-on-surface/80">{lead.organizationName || lead.businessName || "-"}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.city || (lead.companySize ? `${lead.companySize} employees` : "")}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(lead.status)}`}>
                      {lead.demoStatus && lead.demoStatus !== "NONE" ? lead.demoStatus : lead.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.demoStatus === "VERIFIED_PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <form action={async () => {
                          "use server";
                          await approveDemoRequestAction(lead.id);
                        }}>
                          <Button size="sm" className="h-8 text-[10px] font-black uppercase">Approve</Button>
                        </form>
                        <form action={async () => {
                          "use server";
                          await rejectDemoRequestAction(lead.id);
                        }}>
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-rose-400 hover:text-rose-300">Reject</Button>
                        </form>
                      </div>
                    ) : (
                      <Link href={`/platform/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-bold uppercase tracking-tighter text-[10px]">
                          Details <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-3xl border border-outline-variant/30 bg-surface p-4 shadow-soft">
          <p className="text-sm text-on-surface-variant">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={`/platform/leads?q=${encodeURIComponent(params.q || "")}&status=${encodeURIComponent(statusFilter)}&source=${encodeURIComponent(sourceFilter)}&page=${Math.max(1, currentPage - 1)}`}>
                Previous
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={`/platform/leads?q=${encodeURIComponent(params.q || "")}&status=${encodeURIComponent(statusFilter)}&source=${encodeURIComponent(sourceFilter)}&page=${Math.min(totalPages, currentPage + 1)}`}>
                Next
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case "NEW": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "CONTACTED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "BOOKED": return "bg-primary/10 text-primary border-primary/20";
    case "QUALIFIED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "WON": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "LOST": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default: return "bg-surface-container-low text-muted-foreground border-outline-variant/30";
  }
}

