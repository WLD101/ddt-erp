import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductionWorkspace } from "@/modules/production/actions";
import { ProductionClient } from "./production-client";

export default async function ProductionPage() {
  const workspace = await getProductionWorkspace();
  
  if (workspace) {
    return (
      <div className="p-8 h-full flex flex-col overflow-hidden">
        <ProductionClient
          products={workspace.products as any}
          boms={workspace.boms as any}
          workOrders={workspace.workOrders as any}
        />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <Card className="max-w-2xl rounded-3xl border-outline-variant/30 shadow-soft bg-surface">
        <CardHeader>
          <CardTitle className="text-2xl font-black tracking-tight text-on-surface">
            Production Module
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-on-surface-variant">
          <p>This module is currently disabled for your organization type.</p>
          <p>
            Switch this organization to the manufacturing industry type to manage
            production orders, raw material consumption, and finished goods output.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

