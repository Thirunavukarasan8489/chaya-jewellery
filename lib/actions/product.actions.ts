"use server";

import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Inventory } from "@/lib/models/inventory";
import { Category } from "@/lib/models/category";
import { SubCategory } from "@/lib/models/sub-category";
import { Lead } from "@/lib/models/lead";
import { Order } from "@/lib/models/order";
import { getSession } from "@/lib/auth";
import { logAuditAction } from "@/lib/actions/audit";
import { deleteMediaByUrl } from "@/lib/actions/media.actions";
import { ProductSchema } from "@/lib/validations/product.schema";
import { revalidatePath, updateTag } from "next/cache";
import mongoose from "mongoose";
import { sanitizeRichText } from "@/lib/sanitize";
import { recalcProductStockStatus } from "@/lib/inventory";

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

function generateShortname(name: string, length = 3) {
  if (!name) return "UNK";
  return name
    .replace(/[^A-Za-z0-9]/g, "")
    .substring(0, length)
    .toUpperCase();
}

// Generate encoded price code
function encodePrice(price: number): string {
  if (price === undefined || price === null) return "";
  const map: Record<string, string> = {
    '0': 'q', '1': 'm', '2': 'a', '3': 'z', '4': 'r', 
    '5': 't', '6': 'k', '7': 'p', '8': 'l', '9': 'x'
  };
  return price.toString().split('').map(char => map[char] || char).join('');
}

// Generate guaranteed unique slug from product name
export async function generateUniqueProductSlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  const baseSlug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "product";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Product.findOne(query).select("_id").lean();
    if (!exists) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}


export async function getProducts(page = 1, limit = 50) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();
    const skip = (page - 1) * limit;
    const products = await Product.find()
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean();

    const productIds = products.map((p: any) => p._id);
    const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();
    const inventoryMap = new Map(inventories.map((inv: any) => [inv.productId.toString(), inv]));

    const productsWithStock = products.map((p: any) => {
      const inv: any = inventoryMap.get(p._id.toString());
      return {
        ...p,
        availableStock: inv ? inv.availableStock : 0,
        stockStatus: inv ? (inv.availableStock > inv.lowStockThreshold ? 'IN_STOCK' : (inv.availableStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK')) : 'OUT_OF_STOCK',
      };
    });

    const totalCount = await Product.countDocuments();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(productsWithStock)),
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();
    const product: any = await Product.findById(id)
      .populate("category", "name")
      .lean();
    if (!product) return { success: false, error: "Product not found" };
    // Sanitize on the way out too, not just on write — covers products
    // stored before the write-time sanitization in createProduct/
    // updateProduct shipped, and this feeds both the admin view page and
    // the edit form's Quill editor. See lib/sanitize.ts.
    product.description = sanitizeRichText(product.description);
    product.shortDescription = sanitizeRichText(product.shortDescription);
    
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    const parsed = ProductSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;
    // SECURITY: sanitize admin-authored rich text before it's stored — see
    // lib/sanitize.ts. This is rendered raw on public product pages and
    // inside the admin panel itself, so this is the only real gate.
    validatedData.description = sanitizeRichText(validatedData.description);
    validatedData.shortDescription = sanitizeRichText(
      validatedData.shortDescription,
    );

    await dbConnect();

    // Automatically generate guaranteed unique slug on backend
    const slug = await generateUniqueProductSlug(validatedData.name);

    // Handle Category reference
    const mappedData: any = {
      ...validatedData,
      slug,
      category: validatedData.categoryId || validatedData.category,
      subCategory: validatedData.subCategoryId || validatedData.subCategory,
    };
    delete mappedData.categoryId;
    delete mappedData.subCategoryId;

    // Fetch Category and SubCategory to build Product Code
    const categoryObj = await Category.findById(mappedData.category).lean();
    const categoryName = categoryObj ? categoryObj.name : "Uncategorized";
    const subCategoryObj = mappedData.subCategory ? await SubCategory.findById(mappedData.subCategory).lean() : null;
    const subCategoryName = subCategoryObj ? subCategoryObj.name : "GEN";

    const catShort = generateShortname(categoryName);
    const subShort = generateShortname(subCategoryName);
    const prodShort = generateShortname(mappedData.name);
    const prefix = `${catShort}-${subShort}-${prodShort}`;

    // Find highest sequence for this prefix
    const latestProduct = await Product.findOne({ productCode: new RegExp(`^${prefix}-\\d{3}$`) })
      .sort({ productCode: -1 })
      .select("productCode")
      .lean();
    
    let sequence = 1;
    if (latestProduct && latestProduct.productCode) {
      const match = latestProduct.productCode.match(/-(\d{3})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }
    mappedData.productCode = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    if (mappedData.price) {
      mappedData.priceCode = encodePrice(mappedData.price);
    }

    const product = await Product.create(mappedData);

    await logAuditAction({
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product._id.toString(),
      metadata: { name: product.name, slug: product.slug },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/productvarients");
    // Public storefront reads products through unstable_cache (tag
    // 'products', 60s window) — without this, a new/edited/deleted product
    // wouldn't show up on the public site until that window naturally
    // lapsed, no matter how many admin paths above get revalidated.
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);

    const parsed = ProductSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;
    // SECURITY: see createProduct above / lib/sanitize.ts.
    validatedData.description = sanitizeRichText(validatedData.description);
    validatedData.shortDescription = sanitizeRichText(
      validatedData.shortDescription,
    );

    await dbConnect();

    const mappedData: any = { ...validatedData };
    if (mappedData.categoryId) {
      mappedData.category = mappedData.categoryId;
      delete mappedData.categoryId;
    }
    if (mappedData.subCategoryId) {
      mappedData.subCategory = mappedData.subCategoryId;
      delete mappedData.subCategoryId;
    }

    delete mappedData.variants;

    // Fetch old product to find orphaned images and get original slug if needed
    const oldProduct = await Product.findById(id).lean();
    if (!oldProduct) throw new Error("Product not found");

    // Ensure slug is uniquely maintained if name changed
    if (
      mappedData.name &&
      !mappedData.slug &&
      mappedData.name !== oldProduct.name
    ) {
      mappedData.slug = await generateUniqueProductSlug(mappedData.name, id);
    } else if (!mappedData.slug) {
      mappedData.slug = oldProduct.slug;
    }

    if (mappedData.price) {
      mappedData.priceCode = encodePrice(mappedData.price);
    }

    const product = await Product.findByIdAndUpdate(id, mappedData, {
      returnDocument: "after",
    });

    // Clean up orphaned images asynchronously
    if (oldProduct) {
      const oldImages = new Set<string>();
      if (oldProduct.primaryImage?.url)
        oldImages.add(oldProduct.primaryImage.url);
      if (oldProduct.gallery)
        oldProduct.gallery.forEach((g: any) => {
          if (g.url) oldImages.add(g.url);
        });

      const newImages = new Set<string>();
      if (product.primaryImage?.url) newImages.add(product.primaryImage.url);
      if (product.gallery)
        product.gallery.forEach((g: any) => {
          if (g.url) newImages.add(g.url);
        });

      const orphanedImages = Array.from(oldImages).filter(
        (url) => !newImages.has(url),
      );

      // Fire and forget
      Promise.allSettled(orphanedImages.map((url) => deleteMediaByUrl(url)));
    }

    await logAuditAction({
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: id,
      metadata: { name: product?.name },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    updateTag("products");
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    // Check references
    const orderCount = await Order.countDocuments({ "items.productId": id });
    if (orderCount > 0) {
      throw new Error(
        `Cannot delete: Product is referenced in ${orderCount} order(s).`,
      );
    }

    const leadCount = await Lead.countDocuments({ product: id });
    if (leadCount > 0) {
      throw new Error(
        `Cannot delete: Product is referenced in ${leadCount} lead(s).`,
      );
    }

    const productToDelete = await Product.findById(id).lean();
    if (!productToDelete) throw new Error("Product not found");

    const variantsToDelete = await ProductVariant.find({
      productId: id,
    }).lean();

    await Product.findByIdAndDelete(id);
    await ProductVariant.deleteMany({ productId: id });

    // Clean up images asynchronously
    const urlsToDelete = new Set<string>();
    if (productToDelete.primaryImage?.url)
      urlsToDelete.add(productToDelete.primaryImage.url);
    if (productToDelete.gallery) {
      productToDelete.gallery.forEach((g: any) => {
        if (g.url) urlsToDelete.add(g.url);
      });
    }
    for (const v of variantsToDelete as any[]) {
      if (v.primaryImage?.url) urlsToDelete.add(v.primaryImage.url);
      if (v.gallery)
        v.gallery.forEach((g: any) => {
          if (g.url) urlsToDelete.add(g.url);
        });
    }

    // Fire and forget
    Promise.allSettled(
      Array.from(urlsToDelete).map((url) => deleteMediaByUrl(url)),
    );

    await logAuditAction({
      action: "PRODUCT_DELETED",
      entity: "Product",
      entityId: id,
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/productvarients");
    updateTag("products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

