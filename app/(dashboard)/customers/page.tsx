import { getCustomers } from "@/modules/customers/actions";
import { CustomerClient } from "./client";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <CustomerClient initialCustomers={customers} />
    </div>
  );
}
