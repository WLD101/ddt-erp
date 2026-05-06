import { getPayments } from "@/modules/payments/actions";
import { PaymentClient } from "./client";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <PaymentClient initialPayments={payments as any} />
    </div>
  );
}
