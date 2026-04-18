import { z } from "zod";

/**
 * SHARED VALIDATION FRAGMENTS
 * Standardized shapes for common ERP entities
 */

export const contactSchema = {
  email: z.string().email("Invalid email format").nullish().or(z.literal("")),
  phone: z.string().nullish(),
  address: z.string().nullish(),
};

export const moneySchema = z.coerce
  .number()
  .min(0, "Amount must be zero or positive")
  .default(0);

export const quantitySchema = z.coerce
  .number()
  .int("Quantity must be a whole number")
  .min(0, "Quantity cannot be negative")
  .default(0);

export const idSchema = z.string().cuid();

export const dateSchema = z.coerce.date();
