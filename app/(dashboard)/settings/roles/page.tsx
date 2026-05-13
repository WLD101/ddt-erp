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

export default async function RolesPage() {
  // 1. Authorization
  let ctx;
  try {
    ctx = await getCurrentTenantContext();
    requirePermission(ctx, "rbac.manage");
  } catch (err) {
    if (err instanceof TenantForbiddenError) {
      redirect("/dashboard/customers");
    }
    throw err;
  }

  // 2. Data Fetching
  const [roles, allPermissions] = await Promise.all([
    getOrganizationRoles(),
    getAllPermissions(),
  ]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-soft">
            <span className="material-symbols-outlined text-primary text-[32px]">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
              Security <span className="text-primary">Governance</span>
            </h2>
            <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md italic">
              Orchestrate organizational roles and granular capability authorization matrices.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <PermissionsMatrix 
          roles={roles} 
          allPermissions={allPermissions} 
        />
      </div>

      <footer className="pt-12 border-t border-outline-variant/10 text-center">
        <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-[0.4em]">
          End-to-End Tenant Isolation Enforced via Scoped RBAC Node
        </p>
      </footer>
    </div>
  );
}
