type InventoryMutationClient = {
  inventoryItem: {
    updateMany: (...args: any[]) => Promise<{ count: number }>;
    findUnique: (...args: any[]) => Promise<any>;
    update: (...args: any[]) => Promise<any>;
  };
};

type StockTarget = {
  organizationId: string;
  branchId: string;
  productId: string;
};

type StockDecrementTarget = StockTarget & {
  quantity: number;
  productName?: string;
};

type StockAdjustmentTarget = {
  inventoryItemId: string;
  organizationId: string;
  branchId: string;
  adjustment: number;
};

function formatStockError(productName: string | undefined, required: number, available: number) {
  const itemLabel = productName ?? "this product";
  return `Insufficient stock for ${itemLabel}. Required ${required}, available ${available}.`;
}

export async function decrementInventoryOrThrow(
  tx: InventoryMutationClient,
  target: StockDecrementTarget
) {
  const quantity = Number(target.quantity);
  if (quantity <= 0) {
    throw new Error("Stock deduction quantity must be greater than zero.");
  }

  const updated = await tx.inventoryItem.updateMany({
    where: {
      organizationId: target.organizationId,
      branchId: target.branchId,
      productId: target.productId,
      quantity: { gte: quantity },
    },
    data: {
      quantity: { decrement: quantity },
    },
  });

  const inventoryItem = await tx.inventoryItem.findUnique({
    where: {
      organizationId_branchId_productId: {
        organizationId: target.organizationId,
        branchId: target.branchId,
        productId: target.productId,
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  if (updated.count === 0 || !inventoryItem) {
    throw new Error(formatStockError(target.productName, quantity, inventoryItem?.quantity ?? 0));
  }

  return inventoryItem;
}

export async function adjustInventoryOrThrow(
  tx: InventoryMutationClient,
  target: StockAdjustmentTarget
) {
  if (target.adjustment >= 0) {
    return tx.inventoryItem.update({
      where: {
        id_organizationId: {
          id: target.inventoryItemId,
          organizationId: target.organizationId,
        },
      },
      data: {
        quantity: { increment: target.adjustment },
      },
    });
  }

  const deduction = Math.abs(target.adjustment);
  const updated = await tx.inventoryItem.updateMany({
    where: {
      id: target.inventoryItemId,
      organizationId: target.organizationId,
      branchId: target.branchId,
      quantity: { gte: deduction },
    },
    data: {
      quantity: { decrement: deduction },
    },
  });

  const inventoryItem = await tx.inventoryItem.findUnique({
    where: {
      id_organizationId: {
        id: target.inventoryItemId,
        organizationId: target.organizationId,
      },
    },
  });

  if (updated.count === 0 || !inventoryItem) {
    throw new Error(
      `Insufficient stock. Current: ${inventoryItem?.quantity ?? 0}, requested deduction: ${deduction}.`
    );
  }

  return inventoryItem;
}
