"use server";

import dbConnect from "@/lib/db";
import { TemporaryCart } from "@/lib/models/cart";
import { Product } from "@/lib/models/product";
import { Inventory } from "@/lib/models/inventory";
import { CartLine } from "@/lib/types";

export async function syncCart(sessionId: string, lines: CartLine[]) {
  if (!sessionId) return { success: false, error: "No session ID provided" };

  try {
    await dbConnect();

    const items = lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      priceSnapshot: line.unitPrice,
    }));

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await TemporaryCart.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        items,
        expiresAt,
      },
      { upsert: true, returnDocument: "after" },
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function validateCart(sessionId: string) {
  if (!sessionId) return { success: false, error: "No session ID provided" };

  try {
    await dbConnect();

    const cart = await TemporaryCart.findOne({ sessionId }).lean();
    if (!cart || !cart.items || cart.items.length === 0) {
      return { success: false, error: "Cart is empty or expired" };
    }

    // PERFORMANCE: was one Product query plus one ProductVariant query per
    // cart line, serially awaited — a 3-8 item cart meant 6-16 round trips
    // right when a customer is trying to check out. Batch both up front.
    const productIds = [
      ...new Set(cart.items.map((item: any) => String(item.productId))),
    ];
    const [products, inventories] = await Promise.all([
      Product.find({ _id: { $in: productIds } }).lean(),
      Inventory.find({ productId: { $in: productIds } }).lean(),
    ]);

    const productById = new Map(
      products.map((p: any) => [p._id.toString(), p]),
    );
    const inventoryByProduct = new Map<string, any>();
    for (const inv of inventories) {
      inventoryByProduct.set(inv.productId.toString(), inv);
    }

    const validations = [];

    for (const item of cart.items) {
      const product = productById.get(String(item.productId));

      if (!product) {
        validations.push(`Product no longer exists.`);
        continue;
      }

      if (product.status !== "ACTIVE") {
        validations.push(`${product.name} is no longer available.`);
        continue;
      }

      const inv = inventoryByProduct.get(String(item.productId));
      const available = inv ? inv.availableStock : 0;
      if (item.quantity > available) {
        validations.push(`Only ${available} left for ${product.name}.`);
      }
    }

    if (validations.length > 0) {
      return { success: false, error: validations.join(" ") };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
