'use server';

import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/product';
import { ProductVariant } from '@/lib/models/product-variant';
import { Category } from '@/lib/models/category';
import { Lead } from '@/lib/models/lead';
import { Order } from '@/lib/models/order';
import { getSession } from '@/lib/auth';
import { logAuditAction } from '@/lib/actions/audit';
import { deleteMediaByUrl } from '@/lib/actions/media.actions';
import { ProductSchema } from '@/lib/validations/product.schema';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { variantTypeLabel } from '@/lib/utils';

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

function generateShortname(name: string, length = 3) {
  if (!name) return 'UNK';
  return name.replace(/[^A-Za-z0-9]/g, '').substring(0, length).toUpperCase();
}

// Generate guaranteed unique slug from product name
export async function generateUniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'product';

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Product.findOne(query).select('_id').lean();
    if (!exists) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Formats variant name/sku/slug and returns aggregate stock stats, matching
 * the naming rules used at creation time:
 * - category.calculatePriceOnVariantValue=true  -> "<Product Name> <Variant Type> <Variant Value>" (e.g. "Natural Blue Sapphire Gemstone Carat 2.5")
 * - category.calculatePriceOnVariantValue=false -> "<Product Name> <entered variant name>", falling back to "<Product Name> Option N"
 * SKU always uses the category's variantType, since it identifies what kind of variant this product line uses regardless of pricing mode.
 */
function formatVariants(variants: any[], productName: string, category: any, baseSkuPrefix: string, productSlug: string) {
  let totalStock = 0;
  let isLowStock = false;
  const priceOnValue = !!category?.calculatePriceOnVariantValue;
  const skuVariantType = category?.variantType || 'NONE';

  const formatted = variants.map((v: any, idx: number) => {
    if (priceOnValue) {
      v.name = `${productName} ${variantTypeLabel(category?.variantType)} ${v.variantValue ?? ''}`.trim();
    } else {
      const enteredName = v.size && String(v.size).trim() ? String(v.size).trim() : null;
      v.name = enteredName ? `${productName} ${enteredName}` : `${productName} Option ${idx + 1}`;
    }

    if (!v.sku) {
      const indexStr = String(idx + 1).padStart(3, '0');
      v.sku = `${baseSkuPrefix}-${skuVariantType}-${indexStr}`;
    }

    const varSlugSuffix = v.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    v.slug = `${productSlug}-${varSlugSuffix}`;

    const vStock = Number(v.stock) || 0;
    const vThreshold = Number(v.lowStockThreshold) || 5;
    totalStock += vStock;
    if (vStock > 0 && vStock <= vThreshold) {
      isLowStock = true;
    }
    return v;
  });

  const stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = totalStock === 0 ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK';
  return { formatted, totalStock, stockStatus };
}

/** Attaches each product's ProductVariant documents as a `variants` array, matching the old embedded shape. */
async function attachVariants<T extends { _id: any }>(products: T[]): Promise<(T & { variants: any[] })[]> {
  if (products.length === 0) return products as (T & { variants: any[] })[];
  const variants = await ProductVariant.find({ productId: { $in: products.map((p) => p._id) } }).lean();
  const byProduct = new Map<string, any[]>();
  for (const v of variants) {
    const key = v.productId.toString();
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(v);
  }
  return products.map((p) => ({ ...p, variants: byProduct.get(p._id.toString()) || [] }));
}

export async function getProducts(page = 1, limit = 50) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const skip = (page - 1) * limit;
    const products = await Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    const withVariants = await attachVariants(products);

    const totalCount = await Product.countDocuments();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(withVariants)),
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const product = await Product.findById(id).populate('category', 'name').lean();
    if (!product) return { success: false, error: 'Product not found' };
    const [withVariants] = await attachVariants([product as any]);
    return { success: true, data: JSON.parse(JSON.stringify(withVariants)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    const parsed = ProductSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    // Automatically generate guaranteed unique slug on backend
    const slug = await generateUniqueProductSlug(validatedData.name);

    // Handle Category reference
    const mappedData: any = {
      ...validatedData,
      slug,
      category: validatedData.categoryId || validatedData.category
    };
    delete mappedData.categoryId;

    const initialVariants = Array.isArray(mappedData.variants) ? mappedData.variants : [];
    delete mappedData.variants;

    // Fetch Category to build SKU
    const categoryObj = await Category.findById(mappedData.category).lean();
    const categoryName = categoryObj ? categoryObj.name : 'Uncategorized';
    const catShort = generateShortname(categoryName);
    const prodShort = generateShortname(mappedData.name);
    const baseSkuPrefix = `A1-${catShort}-${prodShort}`;

    if (!mappedData.baseSku) {
      mappedData.baseSku = `${baseSkuPrefix}-001`;
    }

    let totalStock = 0;
    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'OUT_OF_STOCK';
    let formattedVariants: any[] = [];

    if (mappedData.hasVariants && initialVariants.length > 0) {
      const result = formatVariants(initialVariants, mappedData.name, categoryObj, baseSkuPrefix, slug);
      formattedVariants = result.formatted;
      totalStock = result.totalStock;
      stockStatus = result.stockStatus;
    }

    mappedData.stockStatus = stockStatus;

    const session = await mongoose.startSession();
    session.startTransaction();

    let product: any;
    try {
      const created = await Product.create([mappedData], { session });
      product = created[0];

      if (formattedVariants.length > 0) {
        await ProductVariant.insertMany(
          formattedVariants.map((v) => ({
            ...v,
            productId: product._id,
            categoryId: categoryObj?._id,
            // Variants have no image UI of their own at creation time, and
            // inherit the product's discount/purchase rules as a starting
            // point — both are still editable per-variant afterward.
            primaryImage: mappedData.primaryImage,
            gallery: mappedData.gallery,
            discountRules: mappedData.discountRules,
            purchaseType: mappedData.purchaseType,
            whatsappEnabled: mappedData.whatsappEnabled,
          })),
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

    await logAuditAction({
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id.toString(),
      metadata: { name: product.name, slug: product.slug }
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/productvarients');
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    const parsed = ProductSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const mappedData: any = { ...validatedData };
    if (mappedData.categoryId) {
      mappedData.category = mappedData.categoryId;
      delete mappedData.categoryId;
    }

    // Variant pricing/stock is managed on the standalone ProductVariant
    // screens, not through the main product edit form.
    delete mappedData.variants;

    // Fetch old product to find orphaned images and get original slug if needed
    const oldProduct = await Product.findById(id).lean();
    if (!oldProduct) throw new Error('Product not found');

    // Ensure slug is uniquely maintained if name changed
    if (mappedData.name && !mappedData.slug && mappedData.name !== oldProduct.name) {
      mappedData.slug = await generateUniqueProductSlug(mappedData.name, id);
    } else if (!mappedData.slug) {
      mappedData.slug = oldProduct.slug;
    }

    // Fetch Category to build SKU
    const categoryObj = await Category.findById(mappedData.category).lean();
    const categoryName = categoryObj ? categoryObj.name : 'Uncategorized';
    const catShort = generateShortname(categoryName);
    const prodShort = generateShortname(mappedData.name);
    const baseSkuPrefix = `A1-${catShort}-${prodShort}`;

    if (!mappedData.baseSku) {
      mappedData.baseSku = `${baseSkuPrefix}-001`;
    }

    const product = await Product.findByIdAndUpdate(id, mappedData, { new: true });

    // Clean up orphaned images asynchronously
    if (oldProduct) {
      const oldImages = new Set<string>();
      if (oldProduct.primaryImage?.url) oldImages.add(oldProduct.primaryImage.url);
      if (oldProduct.gallery) oldProduct.gallery.forEach((g: any) => { if (g.url) oldImages.add(g.url); });

      const newImages = new Set<string>();
      if (product.primaryImage?.url) newImages.add(product.primaryImage.url);
      if (product.gallery) product.gallery.forEach((g: any) => { if (g.url) newImages.add(g.url); });

      const orphanedImages = Array.from(oldImages).filter(url => !newImages.has(url));

      // Fire and forget
      Promise.allSettled(orphanedImages.map(url => deleteMediaByUrl(url)));
    }

    await logAuditAction({
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      metadata: { name: product?.name }
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    // Check references
    const orderCount = await Order.countDocuments({ 'items.productId': id });
    if (orderCount > 0) {
      throw new Error(`Cannot delete: Product is referenced in ${orderCount} order(s).`);
    }

    const leadCount = await Lead.countDocuments({ product: id });
    if (leadCount > 0) {
      throw new Error(`Cannot delete: Product is referenced in ${leadCount} lead(s).`);
    }

    const productToDelete = await Product.findById(id).lean();
    if (!productToDelete) throw new Error('Product not found');

    const variantsToDelete = await ProductVariant.find({ productId: id }).lean();

    await Product.findByIdAndDelete(id);
    await ProductVariant.deleteMany({ productId: id });

    // Clean up images asynchronously
    const urlsToDelete = new Set<string>();
    if (productToDelete.primaryImage?.url) urlsToDelete.add(productToDelete.primaryImage.url);
    if (productToDelete.gallery) {
      productToDelete.gallery.forEach((g: any) => { if (g.url) urlsToDelete.add(g.url); });
    }
    for (const v of variantsToDelete as any[]) {
      if (v.primaryImage?.url) urlsToDelete.add(v.primaryImage.url);
      if (v.gallery) v.gallery.forEach((g: any) => { if (g.url) urlsToDelete.add(g.url); });
    }

    // Fire and forget
    Promise.allSettled(Array.from(urlsToDelete).map(url => deleteMediaByUrl(url)));

    await logAuditAction({
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/productvarients');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVariant(productId: string, variantId: string) {
  try {
    await dbConnect();
    const variant = await ProductVariant.findOne({ _id: variantId, productId }).lean();
    if (!variant) throw new Error('Variant not found');

    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateVariant(productId: string, variantId: string, data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    const variant = await ProductVariant.findOneAndUpdate(
      { _id: variantId, productId },
      { $set: data },
      { new: true }
    );
    if (!variant) throw new Error('Variant not found');

    await logAuditAction({
      action: 'PRODUCT_VARIANT_UPDATED',
      entity: 'Product',
      entityId: productId,
      metadata: { variantId }
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/productvarients');
    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Flat list of every variant across all products, for the standalone Product Variants admin screen. */
export async function getAllProductVariants(page = 1, limit = 50) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const skip = (page - 1) * limit;

    const variants = await ProductVariant.find()
      .populate('productId', 'name slug primaryImage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await ProductVariant.countDocuments();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(variants)),
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Single variant + its parent product, for the standalone view/edit screens. */
export async function getProductVariantById(variantId: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const variant = await ProductVariant.findById(variantId)
      .populate({
        path: 'productId',
        select: 'name slug category',
        populate: { path: 'category', select: 'name variantType calculatePriceOnVariantValue' },
      })
      .lean();
    if (!variant) return { success: false, error: 'Variant not found' };
    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
