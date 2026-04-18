import { getLeadById, updateLeadAction } from "@/modules/leads/actions";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building, Mail, Phone, Globe, Calendar, MessageSquare, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await getLeadById(params.id);

  if (!lead) notFound();

  async function handleStatusUpdate(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    const id = formData.get("id") as string;
    await updateLeadAction(id, { status });
    revalidatePath(`/platform/leads/${id}`);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <Link href="/platform/leads">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
          </Button>
        </Link>
        <div className="flex items-center gap-3">
             <Badge variant="outline" className={`px-4 py-1 text-xs font-black uppercase tracking-widest border ${getStatusStyles(lead.status)}`}>
                Current Status: {lead.status}
             </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <User className="w-32 h-32" />
             </div>
             <CardHeader className="pb-8 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                            {lead.name}
                        </CardTitle>
                        <CardDescription className="text-primary font-bold uppercase tracking-widest text-[10px]">
                            {lead.source} LEAD • ID: {lead.id}
                        </CardDescription>
                    </div>
                </div>
             </CardHeader>
             <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</p>
                                <p className="text-white font-medium">{lead.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</p>
                                <p className="text-white font-medium">{lead.phone || "Not provided"}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Context</p>
                                <p className="text-white font-medium">{lead.businessName || "Individual Inquiry"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{lead.companySize ? `${lead.companySize} employees` : ""} {lead.businessType || ""}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                                <p className="text-white font-medium">{lead.country || "Unknown"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submitted</p>
                                <p className="text-white font-medium">{lead.createdAt.toLocaleString()}</p>
                            </div>
                        </div>
                        {lead.preferredDemoTime && (
                             <div className="flex items-start gap-4 p-3 bg-primary/10 border border-primary/20 rounded-xl ring-2 ring-primary/5 animate-pulse">
                                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Preferred Demo Time</p>
                                    <p className="text-white font-bold">{lead.preferredDemoTime}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 p-6 bg-white/[0.02] border border-white/5 rounded-2xl relative">
                     <div className="absolute top-0 right-0 p-4">
                        <MessageSquare className="w-6 h-6 text-white/5" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Original Message</p>
                     <p className="text-white/80 leading-relaxed italic">
                        "{lead.message || "No message provided."}"
                     </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
           <Card className="bg-black/40 border-white/5 shadow-xl">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/70">Lead Management</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <form action={handleStatusUpdate} className="space-y-4">
                    <input type="hidden" name="id" value={lead.id} />
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pipeline Status</p>
                        <select name="status" defaultValue={lead.status} className="w-full bg-white/5 border-white/10 rounded-lg h-10 px-3 text-sm text-white outline-none focus:ring-1 ring-primary/50">
                            <option value="NEW" className="bg-slate-900">NEW</option>
                            <option value="CONTACTED" className="bg-slate-900">CONTACTED</option>
                            <option value="BOOKED" className="bg-slate-900">BOOKED</option>
                            <option value="QUALIFIED" className="bg-slate-900">QUALIFIED</option>
                            <option value="WON" className="bg-slate-900">WON</option>
                            <option value="LOST" className="bg-slate-900">LOST</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-tight text-xs">
                        Update Workflow
                    </Button>
                </form>

                <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4">Quick Actions</p>
                    <div className="grid grid-cols-1 gap-3">
                        <Button variant="outline" className="justify-start h-11 border-white/5 bg-white/[0.02] hover:bg-white/5 text-xs font-bold uppercase tracking-tight text-white/70">
                            <Mail className="w-4 h-4 mr-3 text-primary" /> Send Email
                        </Button>
                        <Button variant="outline" className="justify-start h-11 border-white/5 bg-white/[0.02] hover:bg-white/5 text-xs font-bold uppercase tracking-tight text-white/70">
                            <Calendar className="w-4 h-4 mr-3 text-primary" /> Schedule Zoom
                        </Button>
                    </div>
                </div>
             </CardContent>
           </Card>

           <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <div className="space-y-1">
                    <p className="text-white font-bold text-sm tracking-tight">Security Cleared</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">This lead was validated via honeypot protection and matches high-intent signals.</p>
                </div>
           </div>
        </div>

      </div>

    </div>
  );
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'NEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'CONTACTED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'BOOKED': return 'bg-primary/10 text-primary border-primary/20';
        case 'QUALIFIED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'WON': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'LOST': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-white/5 text-muted-foreground border-white/10';
    }
}
