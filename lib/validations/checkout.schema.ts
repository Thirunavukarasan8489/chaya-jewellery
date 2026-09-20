import { z } from "zod";

const address = z.object({
  street: z.string().trim().min(1).max(300),
  apartment: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid PIN code."),
  country: z.string().trim().default("India"),
});
const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid product or variant.");

export const CheckoutSchema = z.object({
  checkoutKey: z.string().uuid(),
  customerName: z.string().trim().min(1).max(150),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?91[ -]?)?[6-9][\d -]{9,14}$/, "Enter a valid phone number."),
  shippingAddress: address,
  billingAddress: address,
  paymentMethod: z.enum(["UPI", "CARD", "NET_BANKING", "COD", "BANK_TRANSFER"]),
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId.optional(),
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .min(1)
    .max(100),
});

// An SDK result is diagnostic data from an untrusted browser, never payment proof.
export const CashfreeSdkResultSchema = z.object({
  error: z
    .object({
      message: z.string().max(1000).optional(),
      code: z.string().max(100).optional(),
    })
    .optional(),
  redirect: z.boolean().optional(),
  paymentDetails: z
    .object({ paymentMessage: z.string().max(1000).optional() })
    .optional(),
});
