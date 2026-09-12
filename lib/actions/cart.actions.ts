'use server';

import dbConnect from '@/lib/db';
import { TemporaryCart } from '@/lib/models/cart';
import { Product } from '@/lib/models/product';
import { ProductVariant } from '@/lib/models/product-variant';
import { CartLine } from '@/lib/types';

export async function syncCart(sessionId: string, lines: CartLine[]) {
  if (!sessionId) return { success: false, error: 'No session ID provided' };

  try {
    await dbConnect();

    const items = lines.map(line => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      priceSnapshot: line.unitPrice,
      variantValue: line.variantValue,
      calculatePriceOnVariantValue: line.calculatePriceOnVariantValue
    }));

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await TemporaryCart.findOneAndUpdate(
      { sessionId },
      { 
        sessionId,
        items,
        expiresAt
      },
      { upsert: true, new: true }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function validateCart(sessionId: string) {
  if (!sessionId) return { success: false, error: 'No session ID provided' };

  try {
    await dbConnect();
    
    const cart = await TemporaryCart.findOne({ sessionId }).lean();
    if (!cart || !cart.items || cart.items.length === 0) {
      return { success: false, error: 'Cart is empty or expired' };
    }

    const validations = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).lean();
      
      if (!product) {
        validations.push(`Product no longer exists.`);
        continue;
      }

      if (product.status !== 'ACTIVE') {
        validations.push(`${product.name} is no longer available.`);
        continue;
      }

      let stock = 0;
      let reserved = 0;
      if (item.variantId) {
        const variant = await ProductVariant.findOne({ _id: item.variantId, productId: item.productId }).lean();
        if (variant) {
          stock = variant.stock || 0;
          reserved = variant.reservedQuantity || 0;
        }
      } else {
        // No specific variant selected — validate against the product's total stock.
        const variants = await ProductVariant.find({ productId: item.productId }).lean();
        stock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        reserved = variants.reduce((acc, v) => acc + (v.reservedQuantity || 0), 0);
      }

      const available = Math.max(0, stock - reserved);
      if (item.quantity > available) {
        validations.push(`Only ${available} left for ${product.name}.`);
      }
    }

    if (validations.length > 0) {
      return { success: false, error: validations.join(' ') };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
