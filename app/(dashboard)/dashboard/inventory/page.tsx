import { getInventoryItems } from "@/modules/inventory/actions";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import Link from "next/link";
import { InventoryClient } from "./inventory-client";
import { PageShell } from "@/components/dashboard/page-shell";

export default async function InventoryPage() {
  const inventoryItems = await getInventoryItems();

  return (
    <PageShell
      title="Inventory"
      description="Track stock levels, low-stock exceptions, and product availability across your workspace."
      actions={
        <>
          <a href="/api/export/inventory" download>
            <Button variant="outline" className="h-10 rounded-xl px-5 font-bold">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </a>
          <Button asChild className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
            <Link href="/dashboard/imports">
              <Upload className="w-4 h-4 mr-2" />
              Import Inventory
            </Link>
          </Button>
        </>
      }
    >
      <InventoryClient items={inventoryItems as any} categories={[]} />
    </PageShell>
  );
}
