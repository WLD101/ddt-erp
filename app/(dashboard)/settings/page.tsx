import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
          Organizational <span className="text-primary">Profile</span>
        </h2>
        <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
          Manage identity, regional formatting, and base preferences
        </p>
      </div>

      <ProfileForm
        initialData={{
          ...organization,
          phone: organization.phone ?? undefined,
          email: organization.email ?? undefined,
          address: organization.address ?? undefined,
          country: organization.country ?? undefined,
          taxLabel: organization.taxLabel ?? undefined,
        }}
      />

      <div className="pt-8 border-t border-outline-variant/30">
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-6">Advanced Utilities</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Data Extraction</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant font-medium">
                Download an offline ledger of your organizational data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-5 bg-surface-container-low/30 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-on-surface uppercase tracking-wider">Full Inventory Manifest</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 font-medium italic">Exports all products, SKUs, and physical counts.</p>
                </div>
                <a href="/api/export/inventory" download>
                  <Button variant="outline" size="sm" className="h-9">
                    <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                    CSV
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm">Cloud Connectivity</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant font-medium">
                Manage external ecommerce channels and API nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <a href="/settings/integrations">
                  <Button variant="outline" size="sm" className="h-9">
                    <span className="material-symbols-outlined text-[18px] mr-2">hub</span>
                    Hub
                  </Button>
                </a>
                <a href="/settings/integrations/daraz">
                  <Button variant="outline" size="sm" className="h-9">
                    <span className="material-symbols-outlined text-[18px] mr-2">storefront</span>
                    Daraz
                  </Button>
                </a>
                <a href="/settings/integrations/shopify">
                  <Button variant="outline" size="sm" className="h-9">
                    <span className="material-symbols-outlined text-[18px] mr-2">shopping_bag</span>
                    Shopify
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
