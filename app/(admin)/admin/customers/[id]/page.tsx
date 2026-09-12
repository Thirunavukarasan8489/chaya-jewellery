import { getCustomerById } from '@/lib/actions/customer.actions';
import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { Payment } from '@/lib/models/payment';
import { ReturnRequest } from '@/lib/models/return';
import { Refund } from '@/lib/models/refund';
import CustomerTabsClient from './CustomerTabsClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getCustomerById(resolvedParams.id);
  
  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/customers" className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            {result.error || 'Customer not found'}
          </p>
        </div>
      </div>
    );
  }

  const customer = result.data;
  
  // Fetch related commerce data
  await dbConnect();
  
  const queryConditions = [];
  if (customer.contact?.email) queryConditions.push({ email: customer.contact.email });
  if (customer.contact?.phone) queryConditions.push({ phone: customer.contact.phone });
  
  let orders: any[] = [];
  let payments: any[] = [];
  let returns: any[] = [];
  let refunds: any[] = [];
  
  if (queryConditions.length > 0) {
    orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 }).lean();
    
    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => o._id);
      
      payments = await Payment.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 }).lean();
      
      // Some schemas might use orderId (ObjectId) or orderNumber (String). We'll check for both if necessary.
      // Assuming Return/Refund use orderId reference. 
      if (ReturnRequest) {
        returns = await ReturnRequest.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 }).lean() || [];
      }
      if (Refund) {
        refunds = await Refund.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 }).lean() || [];
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/customers" className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-plum-900 dark:text-white">
            {customer.profile?.firstName} {customer.profile?.lastName}
          </h1>
          <p className="text-sm text-plum-500 dark:text-plum-400 mt-1">
            {customer.type === 'BUSINESS' ? 'Business Customer' : 'Personal Customer'} • Created {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg px-4 py-2 text-center shadow-sm">
             <p className="text-xs text-plum-500 dark:text-plum-400 uppercase tracking-wider">Total Orders</p>
             <p className="text-lg font-semibold text-plum-900 dark:text-white">{orders.length}</p>
           </div>
           <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg px-4 py-2 text-center shadow-sm">
             <p className="text-xs text-plum-500 dark:text-plum-400 uppercase tracking-wider">Total Spend</p>
             <p className="text-lg font-semibold text-gold-600 dark:text-gold-400">
               ₹{orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0).toLocaleString('en-IN')}
             </p>
           </div>
        </div>
      </div>

      <CustomerTabsClient 
        customer={customer} 
        orders={JSON.parse(JSON.stringify(orders))} 
        payments={JSON.parse(JSON.stringify(payments))}
        returns={JSON.parse(JSON.stringify(returns))}
        refunds={JSON.parse(JSON.stringify(refunds))}
      />
    </div>
  );
}
