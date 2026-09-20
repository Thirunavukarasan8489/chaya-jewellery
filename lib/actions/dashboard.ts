"use server";

import connectDB from "@/lib/db";
import { Order } from "@/lib/models/order";
import { User } from "@/lib/models/user";
import { Product } from "@/lib/models/product";
import { Lead } from "@/lib/models/lead";
import { ReturnRequest } from "@/lib/models/return";
import { getSession } from "@/lib/auth";

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const sessionRole = String(session.role || "")
    .replace(/\s+/g, "_")
    .toUpperCase();
  const normalizedRoles = allowedRoles.map((r) =>
    r.replace(/\s+/g, "_").toUpperCase(),
  );
  if (!normalizedRoles.includes(sessionRole))
    throw new Error("Forbidden: Insufficient permissions");
  return session;
}

export async function getDashboardKpis() {
  // SECURITY: this is the only exported action in this file, and unlike
  // every other admin data action in the codebase, it had no role check of
  // its own — only relying on route-level middleware. It's revenue and
  // customer-count data, so gate it the same way admin/products.actions.ts
  // gates its own KPI-adjacent reads.
  await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"]);
  await connectDB();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // PERFORMANCE: these 13 queries have no dependency on each other — they
    // used to run one at a time, serially, stacking their latencies on
    // every dashboard load. Promise.all runs them concurrently instead.
    const [
      revenueResult,
      totalOrders,
      todaysOrders,
      pendingPayments,
      pendingOrders,
      lowStockCount,
      returnsCount,
      totalLeads,
      newLeads,
      contactEnquiries,
      productEnquiries,
      customerCount,
      monthlyRevenue,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            orderStatus: {
              $nin: ["CANCELLED", "DELIVERY_FAILED", "PAYMENT_FAILED"],
            },
          },
        },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ paymentStatus: "PENDING" }),
      Order.countDocuments({ orderStatus: "PROCESSING" }),
      Product.countDocuments({
        stockStatus: { $in: ["LOW_STOCK", "OUT_OF_STOCK"] },
      }),
      ReturnRequest.countDocuments({ status: { $ne: "REJECTED" } }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: "NEW" }),
      Lead.countDocuments({ source: "contact-page" }),
      Lead.countDocuments({ source: "product-enquiry" }),
      User.countDocuments({ role: "CUSTOMER" }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            orderStatus: {
              $nin: ["CANCELLED", "DELIVERY_FAILED", "PAYMENT_FAILED"],
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Format for chart: ['Jan', 'Feb'...] and [12000, 15000...]
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const chartLabels: string[] = [];
    const chartRevenue: number[] = [];
    const chartOrders: number[] = [];

    // Fill in 0s for missing months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      chartLabels.push(monthNames[d.getMonth()]);

      const found = monthlyRevenue.find(
        (r) => r._id.year === y && r._id.month === m,
      );
      chartRevenue.push(found ? found.total : 0);
      chartOrders.push(found ? found.orders : 0);
    }

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        todaysOrders,
        pendingPayments,
        pendingOrders,
        lowStockCount,
        returnsCount,
        totalLeads,
        newLeads,
        contactEnquiries,
        productEnquiries,
        customerCount,
        chartData: {
          labels: chartLabels,
          revenue: chartRevenue,
          orders: chartOrders,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard KPIs:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}
