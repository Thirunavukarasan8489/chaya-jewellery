"use client";

import { useState, useMemo } from 'react';
import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Edit, Trash2, Eye, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { deleteProduct } from '@/lib/actions/product.actions';
import DeleteConfirmButton from '@/components/admin/ui/DeleteConfirmButton';

import Image from 'next/image';

type ProductRow = {
  _id: string;
  name: string;
  slug: string;
  category?: { name: string } | null;
  stockStatus?: string;
  status?: string;
  primaryImage?: { url: string; altText?: string };
  variants?: { price?: number; stock?: number }[];
};

export default function ProductsTable({ products }: { products: ProductRow[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.category?.name !== categoryFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (stockStatusFilter && p.stockStatus !== stockStatusFilter) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter, stockStatusFilter]);

  const uniqueCategories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));

  const renderFilter = () => (
    <div className="relative">
      <button 
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${filterOpen || categoryFilter || statusFilter || stockStatusFilter ? 'bg-gold-50 border-gold-300 text-gold-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
      >
        <Filter size={18} />
        {(categoryFilter || statusFilter || stockStatusFilter) && (
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">Filter Products</h4>
            <button onClick={() => {
              setCategoryFilter('');
              setStatusFilter('');
              setStockStatusFilter('');
            }} className="text-xs text-red-500 hover:underline">
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Stock Status</label>
            <select 
              value={stockStatusFilter} 
              onChange={e => setStockStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const columns = [
    {
      header: 'Product',
      cell: (item: ProductRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-100 dark:bg-gold-800 rounded-md overflow-hidden flex-shrink-0 border border-gold-200 dark:border-gold-700">
            {item.primaryImage?.url ? (
              <Image 
                src={item.primaryImage.url} 
                alt={item.primaryImage.altText || item.name} 
                width={40} 
                height={40} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold-400 text-xs">No img</div>
            )}
          </div>
          <div>
            <p className="font-medium text-gold-800 dark:text-gold-200">{item.name}</p>
            <p className="text-xs text-gold-500 dark:text-gold-400">/{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (item: ProductRow) => (
        <span className="text-gold-700 dark:text-gold-300">{item.category?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Price',
      cell: (item: ProductRow) => {
        let priceText = '—';
        if (item.variants && item.variants.length > 0) {
          const prices = item.variants.map((v: any) => Number(v.price) || 0).filter(p => p > 0);
          if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (minPrice === maxPrice) {
              priceText = `₹${minPrice.toLocaleString('en-IN')}`;
            } else {
              priceText = `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`;
            }
          }
        }
        return (
          <span className="font-medium text-gold-700 dark:text-gold-300">
            {priceText}
          </span>
        );
      },
    },
    {
      header: 'Stock',
      cell: (item: ProductRow) => {
        const qty = item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
        return (
          <span className={qty < 5 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gold-700 dark:text-gold-300'}>
            {qty}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (item: ProductRow) => {
        const stockStatus = item.stockStatus ?? 'IN_STOCK';
        const status = item.status ?? 'ACTIVE';
        let label = 'Active';
        let variant: 'success' | 'warning' | 'danger' | 'neutral' = 'success';
        if (status === 'DRAFT') { label = 'Draft'; variant = 'neutral'; }
        else if (stockStatus === 'LOW_STOCK') { label = 'Low Stock'; variant = 'warning'; }
        else if (stockStatus === 'OUT_OF_STOCK') { label = 'Out of Stock'; variant = 'danger'; }
        return <StatusBadge label={label} variant={variant} />;
      },
    },
    {
      header: 'Actions',
      cell: (item: ProductRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/products/${item._id}`}
            className="p-1 text-gold-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/products/${item._id}/edit`}
            className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            <Edit size={16} />
          </Link>
          <DeleteConfirmButton 
            entityId={item._id} 
            entityName={item.name} 
            deleteAction={deleteProduct} 
          />
        </div>
      ),
    },
  ];

  return <DataTable title="All Products" columns={columns} data={filteredProducts} renderFilter={renderFilter} />;
}
