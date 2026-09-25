import { z } from "zod";

export const SubCategorySchema = z.object({
  category: z.string().min(1, "Category is required"),
  type: z.enum(["SINGLE", "COMBO"]).default("SINGLE"),
  comboIncludes: z.array(z.string()).optional(),
  comboDiscount: z.coerce.number().min(0).optional().default(0),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type SubCategoryInput = z.infer<typeof SubCategorySchema>;
