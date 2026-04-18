import { getSuppliers } from "@/modules/suppliers/actions";
import { SupplierClient } from "./client";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <SupplierClient initialSuppliers={suppliers} />
    </div>
  );
}
