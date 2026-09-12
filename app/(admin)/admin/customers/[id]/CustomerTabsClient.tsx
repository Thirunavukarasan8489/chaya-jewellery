'use client';

import { useState } from 'react';
import OrdersTable from '@/components/admin/orders/OrdersTable';

type TabType = 'overview' | 'business' | 'addresses' | 'orders' | 'payments' | 'returns_refunds' | 'timeline';

const TABS: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'business', label: 'Business & GST' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'returns_refunds', label: 'Returns & Refunds' },
  { id: 'timeline', label: 'Activity Timeline' },
];

export default function CustomerTabsClient({ 
  customer, 
  orders, 
  payments, 
  returns, 
  refunds 
}: { 
  customer: any, 
  orders: any[], 
  payments: any[], 
  returns: any[], 
  refunds: any[] 
}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-6 items-start">
      {/* Vertical Tabs Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg p-2 sticky top-4">
        <nav className="flex flex-col space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-plum-100 dark:bg-plum-800 text-plum-900 dark:text-white border-l-4 border-gold-500'
                  : 'text-plum-600 dark:text-plum-400 hover:bg-gray-50 dark:hover:bg-plum-800/50 hover:text-plum-900 dark:hover:text-white border-l-4 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg p-6 min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Profile & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-plum-500 dark:text-plum-400">First Name</p>
                <p className="font-medium text-plum-900 dark:text-white">{customer.profile?.firstName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-plum-500 dark:text-plum-400">Last Name</p>
                <p className="font-medium text-plum-900 dark:text-white">{customer.profile?.lastName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-plum-500 dark:text-plum-400">Email Address</p>
                <p className="font-medium text-plum-900 dark:text-white">{customer.contact?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-plum-500 dark:text-plum-400">Phone Number</p>
                <p className="font-medium text-plum-900 dark:text-white">{customer.contact?.phone || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Business & GST Information
            </h3>
            {customer.type === 'BUSINESS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-plum-500 dark:text-plum-400">Company Name</p>
                  <p className="font-medium text-plum-900 dark:text-white">{customer.businessDetails?.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-plum-500 dark:text-plum-400">GST Registered</p>
                  <p className="font-medium text-plum-900 dark:text-white">
                    {customer.businessDetails?.gstRegistered ? 'Yes' : 'No'}
                  </p>
                </div>
                {customer.businessDetails?.gstRegistered && (
                  <>
                    <div>
                      <p className="text-sm text-plum-500 dark:text-plum-400">GSTIN</p>
                      <p className="font-medium text-plum-900 dark:text-white">{customer.businessDetails?.gstin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-plum-500 dark:text-plum-400">Legal Name</p>
                      <p className="font-medium text-plum-900 dark:text-white">{customer.businessDetails?.legalName || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-plum-500 dark:text-plum-400">
                This is a personal customer account. Business information is not applicable.
              </p>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Saved Addresses
            </h3>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {customer.addresses.map((addr: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 dark:border-plum-800 rounded-md p-4 bg-gray-50 dark:bg-plum-950">
                    <p className="font-medium text-plum-900 dark:text-white">{addr.name}</p>
                    <p className="text-sm text-plum-600 dark:text-plum-300">{addr.phone}</p>
                    <p className="text-sm text-plum-600 dark:text-plum-300 mt-2">
                      {addr.street1}
                      {addr.street2 && `, ${addr.street2}`}
                    </p>
                    <p className="text-sm text-plum-600 dark:text-plum-300">
                      {addr.city}, {addr.state} {addr.zip}
                    </p>
                    <p className="text-sm text-plum-600 dark:text-plum-300">{addr.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-plum-500 dark:text-plum-400">No saved addresses found.</p>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Order History
            </h3>
            {orders && orders.length > 0 ? (
              <OrdersTable orders={orders} />
            ) : (
              <p className="text-sm text-plum-500 dark:text-plum-400">No orders found for this customer.</p>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Payments
            </h3>
            {payments && payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-plum-800 text-plum-900 dark:text-white">
                    <tr>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-plum-800 text-plum-800 dark:text-plum-200">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="px-4 py-3 font-medium">{p.transactionId || '-'}</td>
                        <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{p.paymentMethod}</td>
                        <td className="px-4 py-3">₹{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-plum-500 dark:text-plum-400">No payment records found.</p>
            )}
          </div>
        )}

        {activeTab === 'returns_refunds' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Returns & Refunds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-plum-800 dark:text-plum-200 mb-3">Returns</h4>
                {returns && returns.length > 0 ? (
                  <ul className="space-y-3">
                    {returns.map(r => (
                      <li key={r._id} className="p-3 border border-gray-200 dark:border-plum-800 rounded-md">
                        <p className="text-sm font-medium text-plum-900 dark:text-white">Status: {r.status}</p>
                        <p className="text-xs text-plum-500 dark:text-plum-400 mt-1">Date: {new Date(r.createdAt).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-plum-500 dark:text-plum-400">No returns found.</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-plum-800 dark:text-plum-200 mb-3">Refunds</h4>
                {refunds && refunds.length > 0 ? (
                  <ul className="space-y-3">
                    {refunds.map(r => (
                      <li key={r._id} className="p-3 border border-gray-200 dark:border-plum-800 rounded-md">
                        <p className="text-sm font-medium text-plum-900 dark:text-white">Status: {r.status} - ₹{(r.amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-plum-500 dark:text-plum-400 mt-1">Date: {new Date(r.createdAt).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-plum-500 dark:text-plum-400">No refunds found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-white border-b border-gray-100 dark:border-plum-800 pb-2">
              Activity Timeline
            </h3>
            <div className="relative border-l border-gray-200 dark:border-plum-700 ml-3 space-y-6">
              {/* Account Created */}
              <div className="pl-6 relative">
                <div className="absolute w-3 h-3 bg-gold-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white dark:ring-plum-900" />
                <p className="text-sm font-medium text-plum-900 dark:text-white">Customer Account Created</p>
                <p className="text-xs text-plum-500 dark:text-plum-400">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
              
              {/* Orders Timeline */}
              {orders && orders.map(order => (
                <div key={order._id} className="pl-6 relative">
                  <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white dark:ring-plum-900" />
                  <p className="text-sm font-medium text-plum-900 dark:text-white">Placed Order {order.orderNumber}</p>
                  <p className="text-xs text-plum-500 dark:text-plum-400">{new Date(order.createdAt).toLocaleDateString()} — ₹{(order.total || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
