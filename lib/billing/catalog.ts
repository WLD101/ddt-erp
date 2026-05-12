import { prisma } from "@/lib/prisma";
import { DEFAULT_PLAN_ID, type PlanId, normalizePlanId } from "@/lib/billing/plans";

type PackageLike = {
  id: string;
  name: string;
  featureJson?: string | null;
};

export function readPackageFeatureMeta(featureJson?: string | null) {
  if (!featureJson) return {};
  try {
    const parsed = JSON.parse(featureJson);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function inferPlanIdFromPackage(pkg?: PackageLike | null, fallback?: string | null): PlanId {
  const featureMeta = readPackageFeatureMeta(pkg?.featureJson);
  const featurePlanId = typeof featureMeta.planId === "string" ? normalizePlanId(featureMeta.planId) : null;
  const namePlanId = normalizePlanId(pkg?.name ?? null);
  const fallbackPlanId = normalizePlanId(fallback);
  return featurePlanId ?? namePlanId ?? fallbackPlanId ?? DEFAULT_PLAN_ID;
}

export async function getActivePackageRecordForPlanId(planId: PlanId) {
  const targetName = planId.charAt(0).toUpperCase() + planId.slice(1);
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  const exact = packages.find((pkg) => inferPlanIdFromPackage(pkg) === planId);
  if (exact) return exact;
  const nameMatch = packages.find((pkg) => pkg.name.toLowerCase() === targetName.toLowerCase());
  return nameMatch ?? null;
}
