import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Category } from "@/lib/models/category";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://chaya-jewellery.vercel.app/";

  // Static routes
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/faqs",
    "/collections",
    "/products",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    await dbConnect();

    // Dynamic Product Routes
    const products = await Product.find({ isActive: true, status: "PUBLISHED" })
      .select("slug updatedAt")
      .lean();
    const productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    // Dynamic Category Routes
    const categories = await Category.find({ isActive: true })
      .select("slug updatedAt")
      .lean();
    const categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/collections/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...productRoutes,
    ];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return staticRoutes;
  }
}
