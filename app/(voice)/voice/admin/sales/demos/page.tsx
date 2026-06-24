import { prisma } from "@/lib/prisma";
import { DemoAccountsTable } from "../DemoAccountsTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DemoAccountsPage() {
  const accounts = await prisma.organization.findMany({
    where: {
      tenantType: {
        in: ["DEMO", "TRIAL"]
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Demo & Trial Accounts</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Manage prospective customers evaluating the Voice AI platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Evaluations</CardTitle>
          <CardDescription>Accounts that are currently in DEMO or TRIAL mode.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DemoAccountsTable accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
