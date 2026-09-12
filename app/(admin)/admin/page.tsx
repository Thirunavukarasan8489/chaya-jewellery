import KpiCard from '@/components/admin/ui/KpiCard';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  Clock, 
  Undo, 
  Phone, 
  MessageSquare, 
  Activity,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { getDashboardKpis } from '@/lib/actions/dashboard';
import { RevenueOrdersChart, LeadStatusChart } from '@/components/admin/ui/AdminCharts';

// Currency formatter
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export default async function AdminDashboard() {
  const kpiData = await getDashboardKpis();
  const data = kpiData.data || { 
    totalRevenue: 0, 
    totalOrders: 0, 
    todaysOrders: 0, 
    pendingPayments: 0, 
    pendingOrders: 0, 
    lowStockCount: 0, 
    returnsCount: 0, 
    totalLeads: 0, 
    newLeads: 0, 
    contactEnquiries: 0, 
    productEnquiries: 0, 
    customerCount: 0,
    chartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      revenue: [0, 0, 0, 0, 0, 0],
      orders: [0, 0, 0, 0, 0, 0]
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
          Real-time metrics, order volumes, inventory alerts, and lead management overview.
        </p>
      </div>

      {/* Commerce KPIs Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
          Commerce Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Revenue" 
            value={formatINR(data.totalRevenue)} 
            icon={DollarSign} 
            iconColor="green"
            trend="up"
            trendValue="+14.8%"
          />
          <KpiCard 
            title="Total Orders" 
            value={data.totalOrders.toLocaleString()} 
            icon={ShoppingCart} 
            iconColor="blue"
          />
          <KpiCard 
            title="Today's Orders" 
            value={data.todaysOrders.toLocaleString()} 
            icon={ShoppingCart} 
            iconColor="blue"
          />
          <KpiCard 
            title="Customers" 
            value={data.customerCount.toLocaleString()} 
            icon={Users} 
            iconColor="purple"
          />
          <KpiCard 
            title="Pending Payments" 
            value={data.pendingPayments.toLocaleString()} 
            icon={Clock} 
            iconColor="amber"
          />
          <KpiCard 
            title="Pending Orders" 
            value={data.pendingOrders.toLocaleString()} 
            icon={Clock} 
            iconColor="amber"
          />
          <KpiCard 
            title="Low Stock Items" 
            value={data.lowStockCount.toLocaleString()} 
            icon={Package} 
            iconColor="red"
          />
          <KpiCard 
            title="Active Returns" 
            value={data.returnsCount.toLocaleString()} 
            icon={Undo} 
            iconColor="red"
          />
        </div>
      </div>

      {/* Lead Management KPIs Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
          Lead Pipeline
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Leads" 
            value={data.totalLeads.toLocaleString()} 
            icon={Activity} 
            iconColor="purple"
          />
          <KpiCard 
            title="New Leads" 
            value={data.newLeads.toLocaleString()} 
            icon={Activity} 
            iconColor="blue"
          />
          <KpiCard 
            title="Contact Enquiries" 
            value={data.contactEnquiries.toLocaleString()} 
            icon={Phone} 
            iconColor="purple"
          />
          <KpiCard 
            title="Product Enquiries" 
            value={data.productEnquiries.toLocaleString()} 
            icon={MessageSquare} 
            iconColor="green"
          />
        </div>
      </div>

      {/* Interactive Charts Section (Chart.js) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gold-100 dark:border-gold-800 pb-3">
            <div>
              <h3 className="font-semibold text-gold-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold-600" />
                Revenue & Sales Performance
              </h3>
              <p className="text-xs text-gold-400 mt-0.5">Monthly revenue trajectory (INR)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full">
              +18.4% YoY
            </span>
          </div>

          <RevenueOrdersChart 
            labels={data.chartData?.labels}
            revenueData={data.chartData?.revenue}
            ordersData={data.chartData?.orders}
          />
        </div>

        {/* Lead Conversion Pipeline Chart */}
        <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-b border-gold-100 dark:border-gold-800 pb-3">
            <h3 className="font-semibold text-gold-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Lead Status Distribution
            </h3>
            <p className="text-xs text-gold-400 mt-0.5">Current lead pipeline stages</p>
          </div>

          <LeadStatusChart 
            newLeads={Math.max(1, data.newLeads)}
            contacted={Math.max(1, data.contactEnquiries)}
            qualified={Math.max(1, data.productEnquiries)}
            converted={Math.max(1, Math.floor(data.totalLeads * 0.4))}
          />
        </div>
        
      </div>
    </div>
  );
}
