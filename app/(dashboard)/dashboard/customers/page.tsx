import { getCustomers } from "@/modules/customers/actions";
import { getCurrentTenantContext } from "@/lib/tenant";
import { CustomerClient } from "./client";

export default async function CustomersPage() {
  const ctx = await getCurrentTenantContext();
  const customers = await getCustomers();
  const canImport = ["owner", "admin"].includes(ctx.role);

  return <CustomerClient initialCustomers={customers} canImport={canImport} />;
}
