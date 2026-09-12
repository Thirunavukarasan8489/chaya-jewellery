"use client";

import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Eye, Edit } from 'lucide-react';
import Link from 'next/link';

type OrderRow = {
  _id: string;
  orderNumber: string;
  customerName: string;
  email?: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus?: string;
};

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  PAYMENT_PENDING:  { label: 'Payment Pending', variant: 'warning' },
  CONFIRMED:        { label: 'Confirmed', variant: 'info' },
  PROCESSING:       { label: 'Processing', variant: 'info' },
  PACKED:           { label: 'Packed', variant: 'info' },
  SHIPPED:          { label: 'Shipped', variant: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'info' },
  DELIVERED:        { label: 'Delivered', variant: 'success' },
  CANCELLED:        { label: 'Cancelled', variant: 'danger' },
  PAYMENT_FAILED:   { label: 'Payment Failed', variant: 'danger' },
  RETURNED:         { label: 'Returned', variant: 'neutral' },
};

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const columns = [
    {
      header: 'Order ID',
      cell: (item: OrderRow) => (
        <span className="font-medium text-plum-900 dark:text-ivory-100">{item.orderNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (item: OrderRow) => (
        <div>
          <p className="font-medium text-plum-900 dark:text-ivory-100">{item.customerName}</p>
          {item.email && <p className="text-xs text-slate-500 dark:text-slate-400">{item.email}</p>}
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (item: OrderRow) => (
        <span className="text-slate-600 dark:text-slate-300 text-sm">
          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Amount',
      cell: (item: OrderRow) => (
        <span className="font-medium text-plum-900 dark:text-ivory-100">
          ₹{(item.total ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item: OrderRow) => {
        const { label, variant } = ORDER_STATUS_MAP[item.orderStatus] ?? { label: item.orderStatus, variant: 'neutral' as const };
        return <StatusBadge label={label} variant={variant} />;
      },
    },
    {
      header: 'Actions',
      cell: (item: OrderRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${item._id}`}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Eye size={16} />
          </Link>
        </div>
      ),
    },
  ];

  return <DataTable title="All Orders" columns={columns} data={orders} />;
}
