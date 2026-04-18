// app/(dashboard)/settings/roles/page.tsx

import { 
  getOrganizationRoles, 
  getAllPermissions 
} from "@/modules/admin/roles-actions";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { 
  getCurrentTenantContext, 
  requirePermission,
  TenantForbiddenError 
} from "@/lib/tenant";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default async function RolesPage() {
  // 1. Authorization
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
    requirePermission(ctx, "rbac.manage");
  } catch (err) {
    if (err instanceof TenantForbiddenError) {
      redirect("/settings"); // Fallback to settings if unauthorized for RBAC
    }
    throw err;
  }

  // 2. Data Fetching
  const [roles, allPermissions] = await Promise.all([
    getOrganizationRoles(),
    getAllPermissions(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Security <span className="text-primary">Governance</span>
          </h2>
        </div>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Orchestrate organizational roles and granular capability authorization.
        </p>
      </header>

      <div className="space-y-6">
        <PermissionsMatrix 
          roles={roles} 
          allPermissions={allPermissions} 
        />
      </div>

      <footer className="pt-10 border-t border-white/5 text-center">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
          End-to-End Tenant Isolation Enforced via Scoped RBAC Engine
        </p>
      </footer>
    </div>
  );
}
