"use server";

import dbConnect from "@/lib/db";
import { Category } from "@/lib/models/category";
import { Product } from "@/lib/models/product";
import { getSession } from "@/lib/auth";
import { CategorySchema } from "@/lib/validations/category.schema";
import { revalidatePath, updateTag } from "next/cache";

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

export async function getCategories() {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]); // Allow lead manager to view categories too
    await dbConnect();
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    const counts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countByCategoryId = new Map(
      counts.map((c) => [String(c._id), c.count]),
    );
    const withCounts = categories.map((c: any) => ({
      ...c,
      productCount: countByCategoryId.get(String(c._id)) ?? 0,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(withCounts)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoryById(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();
    const category = await Category.findById(id).lean();
    if (!category) return { success: false, error: "Category not found" };
    // Not stored on the Category document itself — computed here so the view
    // page (and, incidentally, the list table's "Total Products" column) show
    // a real count instead of always 0.
    const productCount = await Product.countDocuments({ category: id });
    return {
      success: true,
      data: JSON.parse(JSON.stringify({ ...category, productCount })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    // Zod validation
    const parsed = CategorySchema.safeParse(data);
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

    // Check if slug exists
    const existing = await Category.findOne({
      slug: validatedData.slug,
    }).lean();
    if (existing) {
      return {
        success: false,
        error: "Category with this slug already exists",
      };
    }

    const category = await Category.create(validatedData);
    revalidatePath("/admin/categories");
    // Public storefront reads categories (and product listings, which embed
    // category name/slug) through unstable_cache — bust both tags so a new
    // category shows up immediately instead of after the 60s cache window.
    updateTag("categories");
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    // Zod validation
    const parsed = CategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    // Same rule as deleteCategory below: once any product references this
    // category, the category is locked (not just its variant-shaping
    // fields) — reassign or delete those products first.
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot update category: it is currently used by ${productCount} product(s). Please reassign or delete them first.`,
      };
    }

    // We don't want to accidentally overwrite an existing slug on update
    // If we wanted to, we would check if the name changed, but it's safer
    // to leave the slug alone unless explicitly requested.

    const category = await Category.findByIdAndUpdate(id, validatedData, {
      returnDocument: "after",
    }).lean();
    revalidatePath("/admin/categories");
    updateTag("categories");
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    // Check if any products are using this category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete category: it is currently used by ${productCount} product(s). Please reassign or delete them first.`,
      };
    }

    await Category.findByIdAndDelete(id);
    revalidatePath("/admin/categories");
    updateTag("categories");
    updateTag("products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
