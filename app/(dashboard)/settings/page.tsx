import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function SettingsGeneralPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  const organization = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: {
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      country: true,
      currency: true,
      timezone: true,
      taxLabel: true,
    },
  });

  if (!organization) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
          General <span className="text-primary">Settings</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage organizational profile, regional formatting, and base preferences.
        </p>
      </div>

      <ProfileForm initialData={organization} />

      {/* Advanced / Export Settings */}
      <h3 className="text-lg font-black uppercase tracking-widest text-white pt-8 border-t border-white/5">Advanced Utilities</h3>
      
      <Card className="border-white/5 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-black text-white">Data Export</CardTitle>
          <CardDescription>
            Download an offline CSV backup of your organizational data arrays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Full Inventory Ledger</p>
              <p className="text-xs text-muted-foreground mt-1">Exports all products, SKUs, and exact physical counts across all branches.</p>
            </div>
            <a href="/api/export/inventory" download>
              <Button variant="outline" className="font-bold text-xs uppercase tracking-widest border-primary/50 text-white hover:bg-primary/20 hover:text-white">
                <Download className="w-4 h-4 mr-2 text-primary" />
                Export CSV
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
