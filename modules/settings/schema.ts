import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().min(3, "Currency required").default("USD"),
  timezone: z.string().default("UTC"),
  taxLabel: z.string().optional(),
});
