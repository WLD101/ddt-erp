import { ScopedPrisma } from "@/lib/db/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const productionMaterialSchema = z.object({
  productId: z.string().min(1, "Material is required"),
  quantity: z.coerce.number().positive("Material quantity must be greater than zero"),
});

export const productionOrderSchema = z.object({
  productId: z.string().min(1, "Finished product is required"),
  quantity: z.coerce.number().positive("Production quantity must be greater than zero"),
  materials: z.array(productionMaterialSchema).min(1, "Add at least one raw material"),
});

export const bomSchema = z.object({
  productId: z.string().min(1, "Finished product is required"),
  materials: z.array(productionMaterialSchema).min(1, "Add at least one raw material"),
});

export const productionStatusSchema = z.object({
  workOrderId: z.string().min(1, "Production order is required"),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
});

type MaterialInput = z.infer<typeof productionMaterialSchema>;
type ProductionOrderInput = z.infer<typeof productionOrderSchema>;
type BomInput = z.infer<typeof bomSchema>;

export async function getManufacturingOrganization(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      industryType: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  if (organization.industryType !== "manufacturing") {
    throw new Error("Production is available only for manufacturing organizations.");
  }

  return organization;
}

export async function getProductionWorkspace(db: ScopedPrisma, branchId: string) {
  await getManufacturingOrganization(db.organizationId);

  const [products, inventoryItems, workOrders, boms] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
        lowStockThreshold: true,
      },
      orderBy: { name: "asc" },
    }),
    db.inventoryItem.findMany({
      where: { branchId },
      select: {
        productId: true,
        quantity: true,
        location: true,
      },
    }),
    db.workOrder.findMany({
      include: {
        bom: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        materials: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.bOM.findMany({
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const inventoryByProductId = new Map<string, { quantity: number; location: string | null }>();
  for (const item of inventoryItems) {
    inventoryByProductId.set(item.productId, {
      quantity: item.quantity,
      location: item.location,
    });
  }

  return {
    products: products.map((product) => ({
      ...product,
      inventoryQuantity: inventoryByProductId.get(product.id)?.quantity ?? 0,
      location: inventoryByProductId.get(product.id)?.location ?? null,
    })),
    boms,
    workOrders,
  };
}

export async function saveBillOfMaterials(db: ScopedPrisma, input: BomInput) {
  await getManufacturingOrganization(db.organizationId);
  const materials = normalizeMaterials(input.materials);

  const [finishedProduct, rawMaterialProducts] = await Promise.all([
    db.product.findUnique({
      where: { id: input.productId },
      select: { id: true, name: true, sku: true },
    }),
    db.product.findMany({
      where: {
        id: { in: materials.map((material) => material.productId) },
        deletedAt: null,
      },
      select: { id: true },
    }),
  ]);

  if (!finishedProduct) {
    throw new Error("Finished product was not found in this organization.");
  }

  if (materials.some((material) => material.productId === finishedProduct.id)) {
    throw new Error("Finished goods cannot also be listed as a raw material.");
  }

  if (rawMaterialProducts.length !== materials.length) {
    throw new Error("One or more selected raw materials were not found.");
  }

  return db.bOM.upsert({
    where: { productId: input.productId },
    create: {
      organizationId: db.organizationId,
      productId: input.productId,
      items: {
        create: materials.map((material) => ({
          productId: material.productId,
          quantity: material.quantity,
        })),
      },
    },
    update: {
      items: {
        deleteMany: {},
        create: materials.map((material) => ({
          productId: material.productId,
          quantity: material.quantity,
        })),
      },
    },
    include: {
      product: {
        select: { id: true, name: true, sku: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}

export async function createProductionOrder(
  db: ScopedPrisma,
  input: ProductionOrderInput
) {
  await getManufacturingOrganization(db.organizationId);
  const materials = normalizeMaterials(input.materials);
  const bom = await saveBillOfMaterials(db, {
    productId: input.productId,
    materials,
  });

  return db.workOrder.create({
    data: {
      organizationId: db.organizationId,
      bomId: bom.id,
      quantity: input.quantity,
      status: "PLANNED",
      materials: {
        create: materials.map((material) => ({
          organizationId: db.organizationId,
          productId: material.productId,
          quantity: material.quantity,
        })),
      },
    },
    include: {
      bom: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      materials: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function updateProductionOrderStatus(
  db: ScopedPrisma,
  workOrderId: string,
  status: "PLANNED" | "IN_PROGRESS"
) {
  await getManufacturingOrganization(db.organizationId);

  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true, status: true },
  });

  if (!workOrder) {
    throw new Error("Production order not found.");
  }

  if (workOrder.status === "COMPLETED") {
    throw new Error("Completed production orders cannot be moved back.");
  }

  return db.workOrder.update({
    where: { id: workOrderId },
    data: { status },
  });
}

export async function completeProductionOrder(
  organizationId: string,
  branchId: string,
  workOrderId: string
) {
  await getManufacturingOrganization(organizationId);

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findUnique({
      where: {
        id_organizationId: {
          id: workOrderId,
          organizationId,
        },
      },
      include: {
        bom: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        materials: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workOrder) {
      throw new Error("Production order not found.");
    }

    if (workOrder.status === "COMPLETED") {
      throw new Error("This production order has already been completed.");
    }

    if (workOrder.materials.length === 0) {
      throw new Error("Add raw materials before completing this production order.");
    }

    for (const material of workOrder.materials) {
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          organizationId_branchId_productId: {
            organizationId,
            branchId,
            productId: material.productId,
          },
        },
      });

      const availableQuantity = inventoryItem?.quantity ?? 0;
      if (!inventoryItem || availableQuantity < material.quantity) {
        throw new Error(
          `Not enough stock for ${material.product.name}. Required ${material.quantity}, available ${availableQuantity}.`
        );
      }
    }

    for (const material of workOrder.materials) {
      const inventoryItem = await tx.inventoryItem.update({
        where: {
          organizationId_branchId_productId: {
            organizationId,
            branchId,
            productId: material.productId,
          },
        },
        data: {
          quantity: { decrement: material.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          branchId,
          inventoryItemId: inventoryItem.id,
          type: "OUT",
          quantity: material.quantity,
          reason: `Production consumption for ${workOrder.bom.product.name}`,
        },
      });
    }

    const finishedGoodsInventory = await tx.inventoryItem.upsert({
      where: {
        organizationId_branchId_productId: {
          organizationId,
          branchId,
          productId: workOrder.bom.product.id,
        },
      },
      update: {
        quantity: { increment: workOrder.quantity },
      },
      create: {
        organizationId,
        branchId,
        productId: workOrder.bom.product.id,
        quantity: workOrder.quantity,
        location: "Production Output",
      },
    });

    await tx.stockMovement.create({
      data: {
        organizationId,
        branchId,
        inventoryItemId: finishedGoodsInventory.id,
        type: "IN",
        quantity: workOrder.quantity,
        reason: `Production completion for ${workOrder.bom.product.name}`,
      },
    });

    await tx.productionLog.create({
      data: {
        organizationId,
        workOrderId: workOrder.id,
        outputQuantity: workOrder.quantity,
        scrapQuantity: 0,
      },
    });

    return tx.workOrder.update({
      where: {
        id_organizationId: {
          id: workOrderId,
          organizationId,
        },
      },
      data: {
        status: "COMPLETED",
      },
    });
  });
}

function normalizeMaterials(materials: MaterialInput[]) {
  const merged = new Map<string, number>();

  for (const material of materials) {
    const nextQuantity = (merged.get(material.productId) ?? 0) + material.quantity;
    merged.set(material.productId, nextQuantity);
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
