import { getInventoryItems } from "@/modules/inventory/actions";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const inventoryItems = await getInventoryItems();

  return (
    <div className="p-8 space-y-8 flex-1 h-full overflow-auto bg-gradient-to-b from-background to-background/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Inventory Management
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">Monitor stock levels across your catalog.</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/export/inventory" download>
            <Button variant="outline" className="h-10">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </a>
          <Button className="h-10 font-semibold shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Initialize Stock
          </Button>
        </div>
      </div>

      <InventoryClient items={inventoryItems as any} />
    </div>
  );
}
