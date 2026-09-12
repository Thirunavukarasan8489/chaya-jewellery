"use client";

import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Eye, Mail } from 'lucide-react';
import Link from 'next/link';

type CustomerRow = {
  _id: string;
  type: string;
  profile?: { firstName?: string; lastName?: string };
  contact?: { email?: string; phone?: string };
  metrics?: { totalOrders?: number; totalSpend?: number };
  updatedAt: string;
};

export default function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const columns = [
    {
      header: 'Customer',
      cell: (item: CustomerRow) => {
        const name = `${item.profile?.firstName || ''} ${item.profile?.lastName || ''}`.trim() || 'Guest';
        return (
          <div>
            <p className="font-medium text-gold-800 dark:text-gold-200">{name}</p>
            <p className="text-xs text-gold-500 dark:text-gold-400">{item.contact?.phone || '—'}</p>
          </div>
        );
      },
    },
    {
      header: 'Type',
      cell: (item: CustomerRow) => (
        <span className="text-gold-600 dark:text-gold-400 text-sm capitalize">{item.type?.toLowerCase() || 'Personal'}</span>
      ),
    },
    {
      header: 'Email',
      cell: (item: CustomerRow) => (
        <span className="text-gold-600 dark:text-gold-400 text-sm">{item.contact?.email || '—'}</span>
      ),
    },
    {
      header: 'Total Orders',
      cell: (item: CustomerRow) => (
        <span className="font-medium text-gold-700 dark:text-gold-300">{item.metrics?.totalOrders || 0}</span>
      ),
    },
    {
      header: 'Total Spent',
      cell: (item: CustomerRow) => (
        <span className="font-medium text-gold-700 dark:text-gold-300">
          ₹{(item.metrics?.totalSpend || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Last Active',
      cell: (item: CustomerRow) => (
        <span className="text-gold-600 dark:text-gold-400 text-sm">
          {item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item: CustomerRow) => {
        const isActive = (item.metrics?.totalOrders || 0) > 0;
        return <StatusBadge label={isActive ? 'Active' : 'Inactive'} variant={isActive ? 'success' : 'neutral'} />;
      },
    },
    {
      header: 'Actions',
      cell: (item: CustomerRow) => (
        <div className="flex items-center gap-2">
          {item.contact?.email && (
            <a
              href={`mailto:${item.contact.email}`}
              className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
              title="Send email"
            >
              <Mail size={16} />
            </a>
          )}
          <Link
            href={`/admin/customers/${item._id}`}
            className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
            title="View customer"
          >
            <Eye size={16} />
          </Link>
        </div>
      ),
    },
  ];

  return <DataTable title="Customer Directory" columns={columns} data={customers} />;
}
