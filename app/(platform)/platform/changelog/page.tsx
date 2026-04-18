import { getChangelogEntries, createChangelogEntry, deleteChangelogEntry } from "@/modules/changelog/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3, MessageSquare, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function PlatformChangelogDirectory() {
  const entries = await getChangelogEntries();

  async function handleQuickCreate() {
    "use server";
    await createChangelogEntry({
        title: "New Product Update",
        content: "Drafting release notes...",
        category: "FEATURE",
        status: "DRAFT"
    });
    revalidatePath("/platform/changelog");
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteChangelogEntry(id);
    revalidatePath("/platform/changelog");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
            Product <span className="text-primary italic">Manifest</span>
          </h2>
          <p className="text-muted-foreground text-sm">Orchestrate and publish product release notes across all communication channels.</p>
        </div>
        <form action={handleQuickCreate}>
            <Button className="bg-primary hover:bg-primary/90 font-bold uppercase tracking-tight text-xs rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <Plus className="w-4 h-4 mr-2" /> New Release Note
            </Button>
        </form>
      </div>

      <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Title</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Category</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12">Published</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">
                  The manifest is currently empty. Initialize the first product update to get started.
                </TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell>
                     <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                         entry.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-muted-foreground border-white/10'
                     }`}>
                         {entry.status}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-white tracking-tight">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.version || "No Version"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(entry.category)}`}>
                         {entry.category}
                     </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Edit3 className="w-4 h-4" />
                        </Button>
                        <form action={handleDelete}>
                            <input type="hidden" name="id" value={entry.id} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
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

function getCategoryStyles(category: string) {
    switch (category) {
        case 'FEATURE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'IMPROVEMENT': return 'bg-primary/10 text-primary border-primary/20';
        case 'FIX': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'SECURITY': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-white/5 text-muted-foreground border-white/10';
    }
}
