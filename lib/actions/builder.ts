import { getCurrentTenantContext, TenantContext, requireRole, requirePermission } from "@/lib/tenant";
import { getTenantStore, ScopedPrisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PlanConfig } from "@/lib/billing/plans";
import { canUseFeature, assertPlanLimit } from "@/lib/billing/enforcement";
import { trackEvent, AnalyticCategory } from "@/modules/analytics/service";
import { assertErpAccess } from "@/lib/billing/access";
import { DemoModeBlockedError, assertDemoModeWriteAllowed } from "@/lib/demo-mode";

export type ActionContext = {
  ctx: TenantContext;
  orgId: string;
  branchId: string;
  db: ScopedPrisma;
};

export type ActionResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

interface ActionConfig<TInput extends z.ZodTypeAny, TOutput> {
  label: string;
  schema?: TInput;
  roles?: string[];
  permissions?: string[];
  /** Optional. Defaults to true. If false, bypasses the expired trial blocker (e.g. for reading data) */
  enforceBilling?: boolean;
  /** Optional subscription check before execution */
  planGate?: {
    limit?: keyof PlanConfig["limits"];
    feature?: keyof PlanConfig["features"];
  };
  /** Optional revalidation paths to trigger on success */
  revalidatePaths?: string[];
  /** Optional automatic audit logging on success */
  audit?: {
    action: string;
    entityType: string;
    /** Function to extract the ID of the affected entity from the result */
    getEntityId: (result: any) => string;
    /** Optional detailed summary for the log */
    getDetails?: (input: any, result: any) => string;
  };
  /** Optional automated analytics tracking on success */
  analytics?: {
    name: string;
    category: AnalyticCategory;
    getProperties?: (input: any, result: any) => Record<string, any>;
  };
  /** Optional. Prevents execution when DEMO_MODE=true. */
  blockInDemoMode?: boolean;
  handler: (params: { input: any; context: ActionContext }) => Promise<TOutput>;
}

/**
 * High-Order Function to create standardized, tenant-secure server actions.
 * 
 * Features:
 * - Implicit Multi-Tenancy (via scoped DB client)
 * - Input Validation (Zod)
 * - Role-Based Access Control (RBAC)
 * - Permission-Based Access Control
 * - Centralized Error Handling
 * - Automated Audit Logging
 * - Automated Revalidation
 */
export function createServerAction<TInput extends z.ZodTypeAny, TOutput>(
  config: ActionConfig<TInput, TOutput>
) {
  return async (rawData: unknown): Promise<ActionResponse<TOutput>> => {
    try {
      // 1. Authentication & Context Resolution
      const ctx = await getCurrentTenantContext();
      if (config.enforceBilling !== false) {
        await assertErpAccess(ctx);
      }
      
      // 2. Role Authorization
      if (config.roles && config.roles.length > 0) {
        if (!config.roles.includes(ctx.role)) {
          return { success: false, error: `Unauthorized. Requires: [${config.roles.join(", ")}]` };
        }
      }

      // 3. Permission Gating (Granular/Depth)
      if (config.permissions) {
        for (const permission of config.permissions) {
          requirePermission(ctx, permission);
        }
      }

      // 4. Subscription & Plan Gating
      if (config.planGate) {
        const { limit, feature } = config.planGate;
        const orgId = ctx.organizationId;

        // Check feature access
        if (feature) {
          const hasFeature = await canUseFeature(orgId, feature);
          if (!hasFeature) {
            return { 
              success: false, 
              error: `The "${feature}" feature is not available on your current plan. Please upgrade to unlock.` 
            };
          }
        }

        // Check consumption limits
        if (limit) {
          try {
            await assertPlanLimit(orgId, limit);
          } catch (err: any) {
            return { success: false, error: err.message };
          }
        }
      }

      // 4. Input Validation
      let input = rawData as z.infer<TInput>;
      if (config.schema) {
        const parsed = config.schema.safeParse(rawData);
        if (!parsed.success) {
          return { success: false, error: parsed.error.issues[0].message };
        }
        input = parsed.data;
      }

      // 4. Scoped DB Environment
      const context: ActionContext = {
        ctx,
        orgId: ctx.organizationId,
        branchId: ctx.branchId,
        db: getTenantStore(ctx),
      };

      if (config.blockInDemoMode) {
        assertDemoModeWriteAllowed();
      }

      // 5. Logic Execution
      const result = await config.handler({ input, context });

      // 6. Automated Audit Logging
      if (config.audit) {
        await writeAuditLog(
          ctx,
          config.audit.action,
          config.audit.entityType,
          config.audit.getEntityId(result),
          config.audit.getDetails?.(input, result)
        );
      }

      // 6.5 Automated Analytics Tracking
      if (config.analytics) {
        void trackEvent({
          name: config.analytics.name,
          category: config.analytics.category,
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          properties: config.analytics.getProperties?.(input, result),
        });
      }

      // 7. Success Revalidation
      if (config.revalidatePaths) {
        config.revalidatePaths.forEach((path) => revalidatePath(path));
      }

      return { success: true, data: result };

    } catch (err: any) {
      // Standardize Forbidden errors from tenant.ts
      if (err.name === "TenantForbiddenError") {
        return { success: false, error: err.message };
      }
      if (err.name === "ErpAccessError") {
        return { success: false, error: err.message };
      }
      if (err instanceof DemoModeBlockedError || err.name === "DemoModeBlockedError") {
        return { success: false, error: err.message };
      }
      if (err.name === "PlanLimitError") {
        return { success: false, error: err.message };
      }

      // Surface business-logic errors (thrown intentionally from service layer)
      // instead of masking them with a generic "system error" message.
      const msg: string = err.message || "";
      const isBusinessError =
        msg.includes("Insufficient stock") ||
        msg.includes("not found") ||
        msg.includes("access denied") ||
        msg.includes("must be") ||
        msg.includes("already exists") ||
        msg.includes("at least") ||
        msg.includes("required") ||
        msg.includes("cannot") ||
        msg.includes("Insufficient funds");

      if (isBusinessError) {
        return { success: false, error: msg };
      }

      console.error(`[Action:${config.label}] Critical Failure:`, err);
      
      return { 
        success: false, 
        error: "We couldn't complete this request right now. Please refresh and try again. If the issue continues, contact your workspace administrator."
      };
    }
  };
}
