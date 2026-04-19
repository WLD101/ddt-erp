import { z } from "zod";

/**
 * SCHEMA: BRANCH CRUD
 */
export const branchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().optional(),
  address: z.string().optional(),
  isMain: z.boolean().default(false),
});

export const userBranchAssignmentSchema = z.object({
  membershipId: z.string(),
  branchId: z.string().nullable(),
});
