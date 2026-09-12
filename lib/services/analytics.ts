import dbConnect from '../db';
import { Order } from '../models/order';
import { Lead } from '../models/lead';
import { Product } from '../models/product';

export class AnalyticsService {
  static async getDashboardKPIs() {
    await dbConnect();
    
    const [totalOrders, todayOrders, totalLeads, lowStockProducts] = await Promise.all([
      Order.countDocuments({ status: { $ne: 'CANCELLED' } }),
      Order.countDocuments({ 
        createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) },
        status: { $ne: 'CANCELLED' }
      }),
      Lead.countDocuments(),
      Product.countDocuments({ stockStatus: 'LOW_STOCK' })
    ]);

    // Calculate revenue using an aggregation pipeline
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return {
      commerce: {
        totalOrders,
        todayOrders,
        revenue,
        lowStockProducts
      },
      leads: {
        totalLeads
      }
    };
  }
}
