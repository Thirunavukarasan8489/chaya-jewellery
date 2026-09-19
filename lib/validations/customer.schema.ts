import { z } from "zod";

export const customerAddressSchema = z.object({
  name: z.string().min(2, "Full name is required (min 2 characters)"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid phone number"),
  street1: z.string().min(3, "House / Flat / Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z
    .string()
    .min(5, "Postal / PIN code is required")
    .regex(/^[0-9A-Za-z\s-]{4,10}$/, "Please enter a valid PIN code"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
