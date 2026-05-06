import { getCustomers } from "@/modules/customers/actions";
import { CustomerClient } from "./client";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <CustomerClient initialCustomers={customers} />;
}
