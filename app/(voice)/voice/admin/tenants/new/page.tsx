import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createVoiceTenantAction } from "./actions";

export default function NewVoiceTenantPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-3xl space-y-8 px-6 pt-8">
        
        <div className="flex flex-col gap-4 border-b border-outline-variant/20 pb-6">
          <Badge className="w-fit border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            Voice Platform
          </Badge>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tight text-on-surface">Create Tenant</h1>
            <Link href="/voice/admin/tenants">
              <Button variant="outline" className="h-10 rounded-2xl border-outline-variant/40 px-4 text-[11px] font-black uppercase tracking-[0.2em]">
                &larr; Back
              </Button>
            </Link>
          </div>
          <p className="text-sm font-medium text-on-surface-variant">
            Provision a new workspace and Voice Business Profile for a client.
          </p>
        </div>

        <form action={createVoiceTenantAction}>
          <Card className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-8 py-6">
              <CardTitle className="text-lg font-black tracking-tight">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="px-8 py-6 space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Business Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="h-12 w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unique Slug <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="slug" 
                  required 
                  className="h-12 w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. acme-corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Admin Email (Optional)</label>
                <input 
                  type="email" 
                  name="adminEmail" 
                  className="h-12 w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. admin@acmecorp.com"
                />
                <p className="text-xs text-on-surface-variant">If provided, an owner account will be created and linked to this tenant.</p>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full h-12 rounded-2xl bg-primary text-[12px] font-black uppercase tracking-[0.2em] text-on-primary shadow-lg shadow-primary/20 hover:bg-primary/90">
                  Create Tenant Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

      </div>
    </div>
  );
}
