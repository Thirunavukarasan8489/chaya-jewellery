'use server';

import dbConnect from '@/lib/db';
import { ProductVariant } from '@/lib/models/product-variant';
import { StockHistory } from '@/lib/models/stock-history';
import { getSession } from '@/lib/auth';
import { logAuditAction } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { recalcProductStockStatus, adjustInventory } from '@/lib/inventory';

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

// Variant-level list — every ProductVariant is a distinct stock-holding
// document (even single-SKU products store stock on exactly one variant, per
// lib/inventory.ts's resolveVariant()), so inventory rows/adjustments are
// scoped to a single variant rather than aggregated across a product's
// variants.
export async function getInventoryList() {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();

    const variants = await ProductVariant.find()
      .populate({
        path: 'productId',
        select: 'name slug baseSku category',
        populate: { path: 'category', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .lean();

    const inventoryItems = variants
      .filter((v: any) => v.productId)
      .map((v: any) => {
        const product = v.productId;
        const stock = Number(v.stock) || 0;
        const reserved = Number(v.reservedQuantity) || 0;
        const available = Math.max(0, stock - reserved);
        const threshold = Number(v.lowStockThreshold) || 5;

        let status = 'IN_STOCK';
        if (available === 0) {
          status = 'OUT_OF_STOCK';
        } else if (available <= threshold) {
          status = 'LOW_STOCK';
        }

        return {
          _id: v._id.toString(),
          productId: product._id.toString(),
          productName: product.name,
          name: v.name,
          slug: v.slug,
          sku: v.sku || product.baseSku || 'N/A',
          category: product.category?.name || 'Uncategorized',
          categoryId: product.category?._id?.toString() || '',
          stock,
          reserved,
          available,
          lowStockThreshold: threshold,
          status,
          updatedAt: v.updatedAt?.toISOString(),
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
    const authSession = await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
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

      const { previousStock, newStock: variantNewStock } = await adjustInventory(
        params.productId,
        variant._id.toString(),
        params.adjustment,
        session
      );

      const reason = params.reason || 'Manual Adjustment';

      await StockHistory.create(
        [{
          productId: params.productId,
          variantId: variant._id,
          previousStock,
          adjustment: params.adjustment,
          newStock: variantNewStock,
          reason,
          createdBy: authSession.userId,
        }],
        { session }
      );

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
          reason,
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

export async function getStockHistory(params: {
  productId: string;
  variantId?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    const query: Record<string, unknown> = { productId: params.productId };
    if (params.variantId) query.variantId = params.variantId;

    const [entries, total] = await Promise.all([
      StockHistory.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('createdBy', 'name')
        .lean(),
      StockHistory.countDocuments(query),
    ]);

    return {
      success: true,
      data: entries.map((e: any) => ({
        _id: e._id.toString(),
        variantId: e.variantId?.toString(),
        previousStock: e.previousStock,
        adjustment: e.adjustment,
        newStock: e.newStock,
        reason: e.reason || '',
        createdByName: e.createdBy?.name || 'Unknown',
        createdAt: e.createdAt?.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
