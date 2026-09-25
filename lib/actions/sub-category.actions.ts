"use server";

import dbConnect from "@/lib/db";
import { SubCategory } from "@/lib/models/sub-category";
import { Product } from "@/lib/models/product";
import { getSession } from "@/lib/auth";
import { SubCategorySchema } from "@/lib/validations/sub-category.schema";
import { revalidatePath, updateTag } from "next/cache";

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

export async function getSubCategories() {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();
    const subCategories = await SubCategory.find()
      .populate("category", "name")
      .populate("comboIncludes", "name")
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Product.aggregate([
      { $group: { _id: "$subCategory", count: { $sum: 1 } } },
    ]);
    const countBySubCategoryId = new Map(
      counts.map((c) => [String(c._id), c.count])
    );
    const withCounts = subCategories.map((c: any) => ({
      ...c,
      productCount: countBySubCategoryId.get(String(c._id)) ?? 0,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(withCounts)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSubCategoryById(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();
    const subCategory = await SubCategory.findById(id).lean();
    if (!subCategory) return { success: false, error: "SubCategory not found" };
    
    const productCount = await Product.countDocuments({ subCategory: id });
    return {
      success: true,
      data: JSON.parse(JSON.stringify({ ...subCategory, productCount })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSubCategory(data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    const parsed = SubCategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    if (!validatedData.slug && validatedData.name) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const existing = await SubCategory.findOne({
      slug: validatedData.slug,
    }).lean();
    if (existing) {
      return {
        success: false,
        error: "SubCategory with this slug already exists",
      };
    }

    const subCategory = await SubCategory.create(validatedData);
    revalidatePath("/admin/subcategories");
    updateTag("subcategories");
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(subCategory)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSubCategory(id: string, data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    const parsed = SubCategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const subCategory = await SubCategory.findByIdAndUpdate(id, validatedData, {
      returnDocument: "after",
    }).lean();
    revalidatePath("/admin/subcategories");
    updateTag("subcategories");
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(subCategory)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSubCategory(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    const productCount = await Product.countDocuments({ subCategory: id });
    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: it is currently used by ${productCount} product(s). Please reassign or delete them first.`,
      };
    }

    // Check if any combo subcategories are using this subcategory
    const comboCount = await SubCategory.countDocuments({ comboIncludes: id });
    if (comboCount > 0) {
      return {
        success: false,
        error: `Cannot delete subcategory: it is currently part of ${comboCount} combo subcategory(s).`,
      };
    }

    await SubCategory.findByIdAndDelete(id);
    revalidatePath("/admin/subcategories");
    updateTag("subcategories");
    updateTag("products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
