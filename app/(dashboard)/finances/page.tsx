import { getExpenses } from "@/modules/expenses/actions";
import { ExpenseClient } from "./client";

export default async function FinancesPage() {
  const expenses = await getExpenses();

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <ExpenseClient initialExpenses={expenses} />
    </div>
  );
}
