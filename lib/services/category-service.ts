import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/db";
import { Category } from "@/lib/models/category";

export const getCategories = unstable_cache(
  async () => {
    try {
      await dbConnect();
      // Fetch categories (active first, fallback to all)
      let categories = await Category.find({ status: "ACTIVE" })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
      if (!categories || categories.length === 0) {
        categories = await Category.find({})
          .sort({ displayOrder: 1, createdAt: -1 })
          .lean();
      }

      if (categories && categories.length > 0) {
        return categories.map((cat: any) => ({
          ...cat,
          _id: cat._id.toString(),
        }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }

    return [];
  },
  ["public-categories-v5"],
  { revalidate: 60, tags: ["categories"] },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      await dbConnect();
      let category = await Category.findOne({ slug, status: "ACTIVE" }).lean();
      if (!category) {
        category = await Category.findOne({ slug }).lean();
      }
      if (category) {
        return {
          ...category,
          _id: (category as any)._id.toString(),
        };
      }
    } catch (error) {
      console.error("Error fetching category by slug:", error);
    }

    return null;
  },
  ["public-category-by-slug-v5"],
  { revalidate: 60, tags: ["categories"] },
);

export interface MegaMenuSubCategory {
  id: string;
  name: string;
  slug: string;
  type: "SINGLE" | "COMBO";
  description?: string;
  image?: string;
  comboDiscount?: number;
  comboIncludes?: Array<{ id: string; name: string; slug: string }>;
}

export interface MegaMenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subCategories: MegaMenuSubCategory[];
}

export interface MegaMenuComboGroup {
  categoryName: string;
  categorySlug: string;
  combos: MegaMenuSubCategory[];
}

export interface MegaMenuData {
  categories: MegaMenuCategory[];
  combosByCategory: MegaMenuComboGroup[];
  totalCombos: number;
}

export const getMegaMenuData = unstable_cache(
  async (): Promise<MegaMenuData> => {
    try {
      await dbConnect();
      const { SubCategory } = await import("@/lib/models/sub-category");

      const [categoriesDoc, subCategoriesDoc] = await Promise.all([
        Category.find({ status: "ACTIVE" })
          .sort({ displayOrder: 1, createdAt: -1 })
          .lean(),
        SubCategory.find({ status: "ACTIVE" })
          .populate("category", "name slug")
          .populate("comboIncludes", "name slug")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      let categoriesList = categoriesDoc;
      if (!categoriesList || categoriesList.length === 0) {
        categoriesList = await Category.find({})
          .sort({ displayOrder: 1, createdAt: -1 })
          .lean();
      }

      // Separate singles and combos
      const singlesByCatId = new Map<string, MegaMenuSubCategory[]>();
      const combosByCatId = new Map<string, MegaMenuSubCategory[]>();
      let totalCombos = 0;

      for (const sub of (subCategoriesDoc || [])) {
        const catId = (sub.category as any)?._id?.toString() || sub.category?.toString();
        if (!catId) continue;

        if (sub.type === "COMBO") {
          totalCombos++;
          const list = combosByCatId.get(catId) || [];
          list.push({
            id: sub._id.toString(),
            name: sub.name,
            slug: sub.slug,
            type: "COMBO",
            description: sub.description || "",
            image: sub.image || "",
            comboDiscount: sub.comboDiscount || 0,
            comboIncludes: (sub.comboIncludes || []).map((ci: any) => ({
              id: ci._id?.toString() || "",
              name: ci.name || "",
              slug: ci.slug || "",
            })),
          });
          combosByCatId.set(catId, list);
        } else {
          const list = singlesByCatId.get(catId) || [];
          list.push({
            id: sub._id.toString(),
            name: sub.name,
            slug: sub.slug,
            type: "SINGLE",
            description: sub.description || "",
            image: sub.image || "",
          });
          singlesByCatId.set(catId, list);
        }
      }

      const categories: MegaMenuCategory[] = (categoriesList || []).map((cat: any) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        image: cat.image || "",
        subCategories: singlesByCatId.get(cat._id.toString()) || [],
      }));

      const combosByCategory: MegaMenuComboGroup[] = [];
      for (const cat of (categoriesList || [])) {
        const catId = cat._id.toString();
        const combos = combosByCatId.get(catId);
        if (combos && combos.length > 0) {
          combosByCategory.push({
            categoryName: cat.name,
            categorySlug: cat.slug,
            combos,
          });
        }
      }

      return {
        categories,
        combosByCategory,
        totalCombos,
      };
    } catch (error) {
      console.error("Error fetching mega menu data:", error);
      return {
        categories: [],
        combosByCategory: [],
        totalCombos: 0,
      };
    }
  },
  ["public-megamenu-v2"],
  { revalidate: 60, tags: ["categories", "subcategories"] },
);

export const getPublicSubCategories = unstable_cache(
  async () => {
    try {
      await dbConnect();
      const { SubCategory } = await import("@/lib/models/sub-category");
      const subs = await SubCategory.find({ status: "ACTIVE" })
        .populate("category", "name slug")
        .sort({ name: 1 })
        .lean();
      return (subs || []).map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        type: s.type || "SINGLE",
        categorySlug: s.category?.slug || "",
        categoryName: s.category?.name || "",
      }));
    } catch (error) {
      console.error("Error fetching public subcategories:", error);
      return [];
    }
  },
  ["public-subcategories-v2"],
  { revalidate: 60, tags: ["subcategories"] },
);

