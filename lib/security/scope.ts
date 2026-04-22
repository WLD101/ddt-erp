import { AuthorizationError } from "./errors";

export function assertOrganizationAccess(recordOrganizationId: string | null | undefined, activeOrganizationId: string) {
  if (!recordOrganizationId || recordOrganizationId !== activeOrganizationId) {
    throw new AuthorizationError("Resource not found or access denied.", 404);
  }
}

export function assertBranchAccess(params: {
  recordBranchId: string | null | undefined;
  activeBranchId: string;
  role: string;
}) {
  if (["owner", "admin"].includes(params.role)) return;
  if (!params.recordBranchId || params.recordBranchId !== params.activeBranchId) {
    throw new AuthorizationError("Branch access denied.", 403);
  }
}
