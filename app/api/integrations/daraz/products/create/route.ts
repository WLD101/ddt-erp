import { NextResponse } from "next/server";
import { z } from "zod";

import { getTenantStore } from "@/lib/db/client";
import {
  getCurrentTenantContext,
  requirePermission,
  requireRole,
  tenantForbiddenResponse,
} from "@/lib/tenant";
import { createDarazProduct } from "@/lib/integrations/daraz/product-create";

const createDarazProductSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required."),
  productId: z.string().min(1, "Product ID is required."),
});

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentTenantContext();
    requireRole(ctx, "owner", "admin");
    requirePermission(ctx, "products.view");
    requirePermission(ctx, "settings.manage");

    const payload = createDarazProductSchema.parse(await request.json());
    const db = getTenantStore(ctx);
    const result = await createDarazProduct(
      db,
      payload.channelId,
      payload.productId,
      ctx.branchId
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || "Invalid request payload.",
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.name === "TenantForbiddenError") {
      return tenantForbiddenResponse(error);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Daraz product publish failed.",
      },
      { status: 500 }
    );
  }
}
