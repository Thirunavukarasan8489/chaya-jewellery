'use server';

import connectDB from '@/lib/db';
import { Order } from '@/lib/models/order';
import { User } from '@/lib/models/user';
import { Product } from '@/lib/models/product';
import { Lead } from '@/lib/models/lead';
import { ReturnRequest } from '@/lib/models/return';

export async function getDashboardKpis() {
  await connectDB();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Commerce
    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $nin: ['CANCELLED', 'DELIVERY_FAILED', 'PAYMENT_FAILED'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const totalOrders = await Order.countDocuments();
    const todaysOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'PENDING' });
    const pendingOrders = await Order.countDocuments({ orderStatus: 'PROCESSING' });
    const lowStockCount = await Product.countDocuments({ stockStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } });
    const returnsCount = await ReturnRequest.countDocuments({ status: { $ne: 'REJECTED' } });

    // Leads
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'NEW' });
    const contactEnquiries = await Lead.countDocuments({ source: 'contact-page' });
    const productEnquiries = await Lead.countDocuments({ source: 'product-enquiry' });
    
    // Customers
    const customerCount = await User.countDocuments({ role: 'CUSTOMER' });

    // Monthly Revenue for Charts (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $nin: ['CANCELLED', 'DELIVERY_FAILED', 'PAYMENT_FAILED'] }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format for chart: ['Jan', 'Feb'...] and [12000, 15000...]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
      
      const found = monthlyRevenue.find(r => r._id.year === y && r._id.month === m);
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
          orders: chartOrders
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}
