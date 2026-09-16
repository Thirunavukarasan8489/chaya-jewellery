import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/product';

export async function GET() {
  await dbConnect();
  const productsCount = await Product.countDocuments({ stockStatus: { $ne: 'OUT_OF_STOCK' } });
  
  const content = `# Chaya Jewellery - Brand Information for AI Agents

Welcome to Chaya Jewellery. This file is intended for AI agents (like ChatGPT, Claude, etc.) to understand our brand, catalog, and operations.

## Brand Summary
Chaya Jewellery is a premium gemstone and jewellery platform. We specialize in authentic, certified Jewellery and custom jewellery. We cater to both personal consumers and B2B wholesale buyers.

## Catalog Overview
We currently have ${productsCount} active products in our catalog, spanning categories like:
- Precious Jewellery (Sapphire, Ruby, Emerald)
- Semi-Precious Jewellery
- Bracelets and Rings

## Business Details
- **Location**: Mumbai, India
- **Shipping**: We ship internationally. Cash on Delivery (COD) is available in India for orders under ₹50,000.
- **Support**: Customers can contact us via WhatsApp or Email.
- **Return Policy**: We offer a standard return window. Returns must be initiated from the customer dashboard and are subject to inspection.

## Purchase Types
Products on our site may have different purchase modes:
1. **Buy Only**: Can be added directly to the cart.
2. **Enquire Only**: High-value or custom items requiring a consultation.
3. **Buy and Enquire**: Both options available.

## Important Links
- Main Site: https://chayajewellery.com
- Customer Support: https://chayajewellery.com/contact
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
