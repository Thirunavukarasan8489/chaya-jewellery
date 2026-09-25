"use server";

import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Inventory } from "@/lib/models/inventory";
import { InventoryRack } from "@/lib/models/inventory-rack";
import { InventoryMovement } from "@/lib/models/inventory-movement";
import { getSession } from "@/lib/auth";
import { logAuditAction } from "@/lib/actions/audit";
import { revalidatePath, updateTag } from "next/cache";
import mongoose from "mongoose";

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}

export async function getInventoryList() {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();

    const products = await Product.find()
      .populate("category", "name")
      .sort({ updatedAt: -1 })
      .lean();

    const inventoryRecords = await Inventory.find().lean();
    const inventoryMap = new Map(inventoryRecords.map((inv: any) => [inv.productId.toString(), inv]));

    const inventoryItems = products.map((p: any) => {
      const inv: any = inventoryMap.get(p._id.toString()) || null;
      const stock = inv ? inv.availableStock : 0;
      const reserved = inv ? inv.reservedStock : 0;
      const threshold = inv ? inv.lowStockThreshold : 5;

      let status = "IN_STOCK";
      if (stock === 0) status = "OUT_OF_STOCK";
      else if (stock <= threshold) status = "LOW_STOCK";

      return {
        _id: p._id.toString(), // mapping _id to productId for existing UI compatibility
        productId: p._id.toString(),
        inventoryId: inv ? inv._id.toString() : null,
        productName: p.name,
        name: p.name,
        slug: p.slug,
        sku: p.productCode || "N/A",
        category: p.category?.name || "Uncategorized",
        categoryId: p.category?._id?.toString() || "",
        stock,
        reserved,
        available: stock,
        lowStockThreshold: threshold,
        status,
        updatedAt: inv ? inv.updatedAt?.toISOString() : p.updatedAt?.toISOString(),
      };
    });

    return { success: true, data: inventoryItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInventory(params: {
  productId: string;
  openingStock: number;
  lowStockThreshold: number;
  rackCapacity: number;
}) {
  try {
    const authSession = await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Ensure inventory doesn't already exist
      const existing = await Inventory.findOne({ productId: params.productId }).session(session);
      if (existing) {
        throw new Error("Inventory already exists for this product.");
      }

      const product = await Product.findById(params.productId).session(session);
      if (!product) {
        throw new Error("Product not found.");
      }

      // Create master Inventory record
      const inventory = new Inventory({
        productId: params.productId,
        openingStock: params.openingStock,
        availableStock: params.openingStock,
        reservedStock: 0,
        soldStock: 0,
        lowStockThreshold: params.lowStockThreshold,
        rackCapacity: params.rackCapacity,
      });
      await inventory.save({ session });

      // Rack allocation logic
      let remainingStock = params.openingStock;
      let rackNumber = 1;
      const racksToCreate = [];

      while (remainingStock > 0) {
        const qtyToAllocate = Math.min(remainingStock, params.rackCapacity);
        racksToCreate.push({
          inventoryId: inventory._id,
          productId: params.productId,
          rackNumber: rackNumber,
          internalProductCode: `${product.productCode}-R${rackNumber}`,
          quantity: qtyToAllocate,
          capacity: params.rackCapacity,
          status: qtyToAllocate === params.rackCapacity ? "FULL" : "AVAILABLE",
        });
        remainingStock -= qtyToAllocate;
        rackNumber++;
      }

      if (racksToCreate.length > 0) {
        await InventoryRack.insertMany(racksToCreate, { session });
      }

      // Record initial movement
      await InventoryMovement.create([{
        inventoryId: inventory._id,
        productId: params.productId,
        type: "STOCK_IN",
        quantity: params.openingStock,
        previousQuantity: 0,
        newQuantity: params.openingStock,
        reason: "Initial Stock Allocation",
        createdByName: authSession.name || "Admin",
      }], { session });

      await session.commitTransaction();
      session.endSession();

      revalidatePath("/admin/inventory");
      updateTag("products");

      return { success: true };
    } catch (txError: any) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStockLevel(params: {
  productId: string;
  adjustment: number;
  reason?: string;
}) {
  try {
    const authSession = await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await Inventory.findOne({ productId: params.productId }).session(session);
      if (!inventory) {
        throw new Error("Inventory not found for this product.");
      }

      const prevStock = inventory.availableStock;
      const newStock = prevStock + params.adjustment;

      if (newStock < 0) {
        throw new Error("Adjustment results in negative stock.");
      }

      inventory.availableStock = newStock;
      await inventory.save({ session });

      // Note: A full implementation would apply this adjustment to individual racks.
      // For now, this is a simplified global adjustment since the UI doesn't specify which rack to adjust.

      await InventoryMovement.create([{
        inventoryId: inventory._id,
        productId: params.productId,
        type: "MANUAL_ADJUSTMENT",
        quantity: params.adjustment,
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: params.reason || "Manual Stock Adjustment",
        createdByName: authSession.name || "Admin",
      }], { session });

      await session.commitTransaction();
      session.endSession();

      revalidatePath("/admin/inventory");
      updateTag("products");

      return { success: true, newStock };
    } catch (txError: any) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStockHistory(params: { productId: string; page?: number; pageSize?: number }) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const query = { productId: params.productId };

    const [entries, total] = await Promise.all([
      InventoryMovement.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      InventoryMovement.countDocuments(query),
    ]);

    return {
      success: true,
      data: entries.map((e: any) => ({
        _id: e._id.toString(),
        type: e.type,
        previousStock: e.previousQuantity,
        adjustment: e.quantity,
        newStock: e.newQuantity,
        reason: e.reason || "",
        createdByName: e.createdByName || "System",
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

export async function getProductsWithoutInventory() {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
    await dbConnect();

    const existingInventory = await Inventory.find().select("productId").lean();
    const productIdsWithInventory = existingInventory.map((inv: any) => inv.productId);

    const products = await Product.find({
      _id: { $nin: productIdsWithInventory }
    })
      .select("_id name productCode")
      .lean();

    return {
      success: true,
      data: products.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        productCode: p.productCode || "N/A"
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
