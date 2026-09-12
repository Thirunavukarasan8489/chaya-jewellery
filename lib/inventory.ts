import mongoose from 'mongoose';
import { Product } from './models/product';
import { ProductVariant } from './models/product-variant';

/**
 * Calculates the available inventory based on stock minus reserved quantity.
 */
export function calculateAvailability(stockQuantity: number, reservedQuantity: number): number {
  return Math.max(0, stockQuantity - reservedQuantity);
}

/**
 * Recalculates a product's stockStatus from the total across all of its
 * ProductVariant documents. Must be called within the same transaction
 * session as any variant stock/reservation change so the status stays
 * consistent with the variants it summarizes.
 */
export async function recalcProductStockStatus(productId: string, session: mongoose.ClientSession) {
  const variants = await ProductVariant.find({ productId }).session(session);

  let totalAvailable = 0;
  let lowestThreshold = Infinity;

  for (const v of variants) {
    const vStock = Number(v.stock) || 0;
    const vReserved = Number(v.reservedQuantity) || 0;
    totalAvailable += calculateAvailability(vStock, vReserved);
    if (v.lowStockThreshold < lowestThreshold) {
      lowestThreshold = v.lowStockThreshold;
    }
  }

  if (lowestThreshold === Infinity) lowestThreshold = 5;

  let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
  if (totalAvailable === 0) {
    stockStatus = 'OUT_OF_STOCK';
  } else if (totalAvailable <= lowestThreshold) {
    stockStatus = 'LOW_STOCK';
  }

  const totalReserved = variants.reduce((sum, v) => sum + (Number(v.reservedQuantity) || 0), 0);

  await Product.findByIdAndUpdate(
    productId,
    { stockStatus, reservedQuantity: totalReserved },
    { session }
  );

  return { totalAvailable, stockStatus };
}

/**
 * Resolves the ProductVariant document to operate on. Falls back to the
 * product's only variant when no variantId is supplied (single-SKU products
 * still store their stock on exactly one ProductVariant document).
 */
async function resolveVariant(productId: string, variantId: string | undefined, session: mongoose.ClientSession) {
  if (variantId) {
    const variant = await ProductVariant.findOne({ _id: variantId, productId }).session(session);
    if (variant) return variant;
  }
  return ProductVariant.findOne({ productId }).session(session);
}

/**
 * Reserves inventory for a product variant during checkout.
 * MUST be called within a MongoDB transaction session.
 */
export async function reserveInventory(productId: string, variantId: string, quantity: number, session: mongoose.ClientSession) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const variant = await resolveVariant(productId, variantId, session);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found for product ${product.name}`);
  }

  const available = calculateAvailability(variant.stock, variant.reservedQuantity || 0);
  if (available < quantity) {
    throw new Error(`Insufficient stock for ${product.name}. Available: ${available}, Requested: ${quantity}`);
  }

  variant.reservedQuantity = (variant.reservedQuantity || 0) + quantity;
  await variant.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Releases reserved inventory (e.g., if checkout fails, order cancelled, or cart expires).
 * MUST be called within a MongoDB transaction session.
 */
export async function releaseInventory(productId: string, variantId: string, quantity: number, session: mongoose.ClientSession) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const variant = await resolveVariant(productId, variantId, session);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found for product ${product.name}`);
  }

  variant.reservedQuantity = Math.max(0, (variant.reservedQuantity || 0) - quantity);
  await variant.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Finalizes inventory (e.g., payment successful).
 * Decrements stock and clears the reservation.
 * MUST be called within a MongoDB transaction session.
 */
export async function finalizeInventory(productId: string, variantId: string, quantity: number, session: mongoose.ClientSession) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const variant = await resolveVariant(productId, variantId, session);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found for product ${product.name}`);
  }

  variant.stock = Math.max(0, (variant.stock || 0) - quantity);
  variant.reservedQuantity = Math.max(0, (variant.reservedQuantity || 0) - quantity);
  await variant.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Restocks finalized inventory (e.g., cancelled paid order or returned item).
 * Increments stock.
 * MUST be called within a MongoDB transaction session.
 */
export async function restockInventory(productId: string, variantId: string, quantity: number, session: mongoose.ClientSession) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const variant = await resolveVariant(productId, variantId, session);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found for product ${product.name}`);
  }

  variant.stock = (variant.stock || 0) + quantity;
  await variant.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}
