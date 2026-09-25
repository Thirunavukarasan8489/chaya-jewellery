import mongoose from "mongoose";
import { Product } from "./models/product";
import { Inventory } from "./models/inventory";

/**
 * Calculates the available inventory based on available stock minus reserved quantity.
 */
export function calculateAvailability(
  availableStock: number,
  reservedQuantity: number,
): number {
  return Math.max(0, availableStock - reservedQuantity);
}

/**
 * Recalculates a product's stockStatus from its Inventory document.
 * Must be called within the same transaction session as any stock/reservation change.
 */
export async function recalcProductStockStatus(
  productId: string,
  session?: mongoose.ClientSession | null,
) {
  const query = Inventory.findOne({ productId });
  if (session) query.session(session);
  const inventory = await query;

  let totalAvailable = 0;
  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "OUT_OF_STOCK";
  let totalReserved = 0;

  if (inventory) {
    totalAvailable = calculateAvailability(inventory.availableStock || 0, inventory.reservedStock || 0);
    totalReserved = inventory.reservedStock || 0;
    
    if (totalAvailable === 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (totalAvailable <= (inventory.lowStockThreshold || 5)) {
      stockStatus = "LOW_STOCK";
    } else {
      stockStatus = "IN_STOCK";
    }
  }

  await Product.findByIdAndUpdate(
    productId,
    { stockStatus, reservedQuantity: totalReserved },
    { session },
  );

  return { totalAvailable, stockStatus };
}

/**
 * Reserves inventory for a product during checkout.
 * MUST be called within a MongoDB transaction session.
 */
export async function reserveInventory(
  productId: string,
  quantity: number,
  session: mongoose.ClientSession,
) {
  if (!Number.isInteger(quantity) || quantity <= 0)
    throw new Error("Invalid item quantity.");
  
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  if (product.status !== "ACTIVE" || product.purchaseType === "ENQUIRE_ONLY") {
    throw new Error(`${product.name} is no longer available for purchase.`);
  }

  const inventory = await Inventory.findOne({ productId }).session(session);
  if (!inventory) {
    throw new Error(`Inventory not found for product ${product.name}`);
  }

  const available = calculateAvailability(
    inventory.availableStock,
    inventory.reservedStock || 0,
  );
  if (available < quantity) {
    throw new Error(
      `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${quantity}`,
    );
  }

  const reserved = await Inventory.findOneAndUpdate(
    {
      _id: inventory._id,
      productId,
      $expr: {
        $gte: [
          { $subtract: ["$availableStock", { $ifNull: ["$reservedStock", 0] }] },
          quantity,
        ],
      },
    },
    { $inc: { reservedStock: quantity } },
    { session, returnDocument: "after" },
  );
  if (!reserved) throw new Error(`Insufficient stock for ${product.name}.`);

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Releases reserved inventory (e.g., if checkout fails, order cancelled, or cart expires).
 * MUST be called within a MongoDB transaction session.
 */
export async function releaseInventory(
  productId: string,
  quantity: number,
  session: mongoose.ClientSession,
) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const inventory = await Inventory.findOne({ productId }).session(session);
  if (!inventory) {
    throw new Error(`Inventory not found for product ${product.name}`);
  }

  inventory.reservedStock = Math.max(
    0,
    (inventory.reservedStock || 0) - quantity,
  );
  await inventory.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Finalizes inventory (e.g., payment successful).
 * Decrements stock and clears the reservation.
 * MUST be called within a MongoDB transaction session.
 */
export async function finalizeInventory(
  productId: string,
  quantity: number,
  session: mongoose.ClientSession,
) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const inventory = await Inventory.findOne({ productId }).session(session);
  if (!inventory) {
    throw new Error(`Inventory not found for product ${product.name}`);
  }

  if (inventory.availableStock < quantity || (inventory.reservedStock || 0) < quantity) {
    throw new Error(
      `The stock reservation for ${product.name} is unavailable. Please review this payment.`,
    );
  }
  inventory.availableStock -= quantity;
  inventory.reservedStock -= quantity;
  await inventory.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}

/**
 * Applies a manual (admin) stock adjustment by a signed delta.
 * MUST be called within a MongoDB transaction session.
 */
export async function adjustInventory(
  productId: string,
  delta: number,
  session: mongoose.ClientSession,
) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const inventory = await Inventory.findOne({ productId }).session(session);
  if (!inventory) {
    throw new Error(`Inventory not found for product ${product.name}`);
  }

  const previousStock = Number(inventory.availableStock) || 0;
  const newStock = Math.max(0, previousStock + delta);
  inventory.availableStock = newStock;
  await inventory.save({ session });

  await recalcProductStockStatus(productId, session);
  return { previousStock, newStock };
}

/**
 * Restocks finalized inventory (e.g., cancelled paid order or returned item).
 * Increments stock.
 * MUST be called within a MongoDB transaction session.
 */
export async function restockInventory(
  productId: string,
  quantity: number,
  session: mongoose.ClientSession,
) {
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const inventory = await Inventory.findOne({ productId }).session(session);
  if (!inventory) {
    throw new Error(`Inventory not found for product ${product.name}`);
  }

  inventory.availableStock = (inventory.availableStock || 0) + quantity;
  await inventory.save({ session });

  await recalcProductStockStatus(productId, session);
  return product;
}
