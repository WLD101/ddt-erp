"use server";

import { revalidatePath } from "next/cache";

import { getCurrentTenantContext } from "@/lib/tenant";
import { getTenantStore } from "@/lib/db/client";
import { assertErpAccess } from "@/lib/billing/access";
import { parseAssistantCommand } from "./parser";
import { executeAssistantCommand } from "./service";
import { assistantCommandSchema, type AssistantExecutionResult, type AssistantParseResult } from "./types";

export async function parseAssistantCommandAction(input: string): Promise<AssistantParseResult> {
  try {
    const ctx = await getCurrentTenantContext();
    await assertErpAccess(ctx);
    const db = getTenantStore(ctx);
    return await parseAssistantCommand(db, ctx.branchId, input);
  } catch (error) {
    console.error("[SMART_ASSISTANT_PARSE]", error);
    return {
      success: false,
      command: null,
      response:
        "I couldn't prepare that assistant action right now. Please refresh and try again. If the issue continues, contact your workspace administrator.",
    };
  }
}

export async function executeAssistantCommandAction(rawCommand: unknown): Promise<AssistantExecutionResult> {
  try {
    const command = assistantCommandSchema.parse(rawCommand);
    const ctx = await getCurrentTenantContext();
    await assertErpAccess(ctx);
    const db = getTenantStore(ctx);
    const result = await executeAssistantCommand(db, ctx, command);

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/customers");
      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/inventory");
      revalidatePath("/sales");
      revalidatePath("/finances");
      revalidatePath("/dashboard/reports");
    }

    return result;
  } catch (error: any) {
    if (error?.name === "TenantForbiddenError" || error?.name === "ErpAccessError") {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("[SMART_ASSISTANT_EXECUTE]", error);
    return {
      success: false,
      message:
        "I couldn't complete that assistant action right now. Please review the preview and try again.",
    };
  }
}
