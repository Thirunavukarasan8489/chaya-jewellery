'use server';

import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/product';
import { ProductVariant } from '@/lib/models/product-variant';
import { getSession } from '@/lib/auth';
import { logAuditAction } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { recalcProductStockStatus } from '@/lib/inventory';

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

export async function getInventoryList() {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();

    const products = await Product.find()
      .populate('category', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    const allVariants = await ProductVariant.find({ productId: { $in: products.map((p: any) => p._id) } }).lean();
    const variantsByProduct = new Map<string, any[]>();
    for (const v of allVariants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    const inventoryItems = products.map((p: any) => {
      const variants = variantsByProduct.get(p._id.toString()) || [];
      const totalStock = variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
      const reserved = variants.reduce((sum: number, v: any) => sum + (Number(v.reservedQuantity) || 0), 0);
      const available = Math.max(0, totalStock - reserved);
      const threshold = variants.length > 0
        ? Math.min(...variants.map((v: any) => Number(v.lowStockThreshold) || 5))
        : 5;

      let status = 'IN_STOCK';
      if (available === 0) {
        status = 'OUT_OF_STOCK';
      } else if (available <= threshold) {
        status = 'LOW_STOCK';
      }

      return {
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        sku: p.baseSku || 'N/A',
        category: p.category?.name || 'Uncategorized',
        categoryId: p.category?._id?.toString() || '',
        hasVariants: p.hasVariants || false,
        variants: variants.map((v: any) => ({
          _id: v._id?.toString() || '',
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock || 0,
        })),
        stock: totalStock,
        reserved,
        available,
        lowStockThreshold: threshold,
        status,
        updatedAt: p.updatedAt?.toISOString(),
      };
    });

    return { success: true, data: inventoryItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStockLevel(params: {
  productId: string;
  variantId?: string;
  adjustment: number; // positive to add, negative to subtract
  reason?: string;
}) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const variant = params.variantId
        ? await ProductVariant.findOne({ _id: params.variantId, productId: params.productId }).session(session)
        : await ProductVariant.findOne({ productId: params.productId }).session(session);

      if (!variant) {
        throw new Error('Variant not found');
      }

      variant.stock = Math.max(0, (variant.stock || 0) + params.adjustment);
      await variant.save({ session });

      const { totalAvailable, stockStatus } = await recalcProductStockStatus(params.productId, session);

      const totalStock = await ProductVariant.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(params.productId) } },
        { $group: { _id: null, total: { $sum: '$stock' } } },
      ]).session(session);

      await session.commitTransaction();
      session.endSession();

      const newStock = totalStock[0]?.total || 0;

      await logAuditAction({
        action: 'INVENTORY_STOCK_ADJUSTED',
        entity: 'Product',
        entityId: params.productId,
        metadata: {
          variantId: params.variantId,
          adjustment: params.adjustment,
          newStockQuantity: newStock,
          reason: params.reason || 'Manual Adjustment',
        },
      });

      revalidatePath('/admin/inventory');
      revalidatePath('/admin/products');
      return { success: true, newStock, stockStatus, available: totalAvailable };
    } catch (txError: any) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
