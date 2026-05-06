"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  completeProductionOrder,
  createProductionOrder,
  moveProductionOrderToInProgress,
  saveBillOfMaterials,
} from "@/modules/production/actions";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  inventoryQuantity: number;
  location: string | null;
};

type WorkOrderRecord = {
  id: string;
  status: string;
  quantity: number;
  createdAt?: string;
  bom: {
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  };
  materials: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  }>;
  logs?: Array<{
    id: string;
    outputQuantity: number;
  }>;
};

type BomRecord = {
  id: string;
  productId: string;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  }>;
};

type MaterialRow = {
  productId: string;
  quantity: string;
};

export function ProductionClient({
  products,
  boms,
  workOrders,
}: {
  products: ProductOption[];
  boms: BomRecord[];
  workOrders: WorkOrderRecord[];
}) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [materials, setMaterials] = useState<MaterialRow[]>([
    { productId: products[0]?.id ?? "", quantity: "1" },
  ]);
  const [isPending, startTransition] = useTransition();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const planned = workOrders.filter((order) => order.status === "PLANNED").length;
    const inProgress = workOrders.filter((order) => order.status === "IN_PROGRESS").length;
    const completed = workOrders.filter((order) => order.status === "COMPLETED").length;

    return { planned, inProgress, completed };
  }, [workOrders]);

  const productLookup = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  const bomLookup = useMemo(
    () => new Map(boms.map((bom) => [bom.productId, bom])),
    [boms]
  );

  useEffect(() => {
    const savedBom = bomLookup.get(selectedProductId);
    if (savedBom?.items.length) {
      setMaterials(
        savedBom.items.map((item) => ({
          productId: item.product.id,
          quantity: String(item.quantity),
        }))
      );
      return;
    }

    setMaterials([{ productId: products[0]?.id ?? "", quantity: "1" }]);
  }, [selectedProductId, bomLookup, products]);

  const handleAddMaterial = () => {
    setMaterials((current) => [...current, { productId: products[0]?.id ?? "", quantity: "1" }]);
  };

  const handleMaterialChange = (index: number, key: keyof MaterialRow, value: string) => {
    setMaterials((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleCreateOrder = () => {
    startTransition(async () => {
      const result = await createProductionOrder({
        productId: selectedProductId,
        quantity,
        materials,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create production order");
        return;
      }

      toast.success("Production order created");
      setQuantity("1");
      setMaterials([{ productId: products[0]?.id ?? "", quantity: "1" }]);
    });
  };

  const handleStartOrder = (workOrderId: string) => {
    setActiveOrderId(workOrderId);
    startTransition(async () => {
      const result = await moveProductionOrderToInProgress({ workOrderId });
      if (!result.success) {
        toast.error(result.error || "Failed to start production order");
      } else {
        toast.success("Production order moved to in progress");
      }
      setActiveOrderId(null);
    });
  };

  const handleCompleteOrder = (workOrderId: string) => {
    setActiveOrderId(workOrderId);
    startTransition(async () => {
      const result = await completeProductionOrder({ workOrderId });
      if (!result.success) {
        toast.error(result.error || "Failed to complete production order");
      } else {
        toast.success("Production order completed and stock updated");
      }
      setActiveOrderId(null);
    });
  };

  const handleSaveBom = () => {
    startTransition(async () => {
      const result = await saveBillOfMaterials({
        productId: selectedProductId,
        materials,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save bill of materials");
        return;
      }

      toast.success("Bill of materials saved");
    });
  };

  const selectedBom = bomLookup.get(selectedProductId);

  return (
    <div className="space-y-8 flex-1 flex flex-col overflow-auto pb-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline-md">
            Production Control
          </h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1">
            Plan manufacturing output, consume raw materials, and post finished goods into inventory.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard title="Planned Orders" value={metrics.planned} icon="assignment" />
        <MetricCard title="In Progress" value={metrics.inProgress} icon="manufacturing" />
        <MetricCard title="Completed" value={metrics.completed} icon="task_alt" />
      </div>

      <Card className="rounded-3xl border-outline-variant/30 shadow-soft bg-surface">
        <CardHeader>
          <CardTitle className="text-xl font-black tracking-tight text-on-surface">
            New Production Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="production-product">Product to produce</Label>
              <select
                id="production-product"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ""} - stock {product.inventoryQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="production-quantity">Quantity to produce</Label>
              <Input
                id="production-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Raw Material Consumption</p>
                <p className="text-xs text-on-surface-variant">
                  Saved BOM is auto-loaded for the selected finished product and can be edited before production.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedBom ? (
                  <Badge className="bg-secondary/15 text-secondary border-transparent">
                    BOM saved
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-700 border-transparent">
                    No BOM saved
                  </Badge>
                )}
                <Button type="button" variant="outline" onClick={handleAddMaterial}>
                  Add Material
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {materials.map((material, index) => (
                <div key={`${material.productId}-${index}`} className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
                  <select
                    value={material.productId}
                    onChange={(event) => handleMaterialChange(index, "productId", event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {products.map((product) => (
                      <option key={`${product.id}-${index}`} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ""} - stock {product.inventoryQuantity}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={material.quantity}
                    onChange={(event) => handleMaterialChange(index, "quantity", event.target.value)}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={materials.length === 1}
                    onClick={() => handleRemoveMaterial(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex gap-3">
              <Button type="button" variant="outline" disabled={isPending || !selectedProductId} onClick={handleSaveBom}>
                {isPending ? "Saving..." : "Save BOM"}
              </Button>
              <Button disabled={isPending || !selectedProductId} onClick={handleCreateOrder}>
                {isPending ? "Creating..." : "Create Production Order"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-outline-variant/30 shadow-soft bg-surface overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-black tracking-tight text-on-surface">
            Production Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Finished Good</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Raw Materials</TableHead>
                <TableHead>Stock Impact</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="pl-6">
                    <div className="space-y-1">
                      <p className="font-bold text-on-surface">{order.bom.product.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {order.bom.product.sku || "No SKU"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClassName(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-on-surface">{order.quantity}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.materials.map((material) => {
                        const stock = productLookup.get(material.product.id)?.inventoryQuantity ?? 0;
                        return (
                          <div key={material.id} className="text-xs text-on-surface-variant">
                            {material.product.name} x {material.quantity}{" "}
                            <span className="text-on-surface-variant/60">(stock {stock})</span>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-on-surface-variant">
                    <p>Consumes listed materials from the active branch.</p>
                    <p>Adds {order.quantity} units to finished goods inventory on completion.</p>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === "PLANNED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending && activeOrderId === order.id}
                          onClick={() => handleStartOrder(order.id)}
                        >
                          Start
                        </Button>
                      )}
                      {order.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          disabled={isPending && activeOrderId === order.id}
                          onClick={() => handleCompleteOrder(order.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {workOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-on-surface-variant">
                    No production orders yet. Create the first order to consume raw materials and post finished goods into stock.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <Card className="rounded-3xl border-outline-variant/30 shadow-soft bg-surface">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-on-surface">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatus(status: string) {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "COMPLETED") return "Completed";
  return "Planned";
}

function statusBadgeClassName(status: string) {
  return cn(
    "border-transparent",
    status === "COMPLETED" && "bg-secondary/15 text-secondary",
    status === "IN_PROGRESS" && "bg-primary/15 text-primary",
    status === "PLANNED" && "bg-amber-500/15 text-amber-700"
  );
}

