import { getSuppliers } from "@/modules/suppliers/actions";
import { getCurrentTenantContext } from "@/lib/tenant";
import { SupplierClient } from "./client";

export default async function SuppliersPage() {
  const ctx = await getCurrentTenantContext();
  const suppliers = await getSuppliers();
  const canImport = ["owner", "admin"].includes(ctx.role);

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <SupplierClient initialSuppliers={suppliers} canImport={canImport} />
    </div>
  );
}
