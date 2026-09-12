'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  RefreshCw,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  X,
  Layers
} from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { getInventoryList, updateStockLevel } from '@/lib/actions/inventory.actions';
import { getCategories } from '@/lib/actions/category.actions';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [invRes, catRes] = await Promise.all([
      getInventoryList(),
      getCategories(),
    ]);

    if (invRes.success && invRes.data) {
      setInventory(invRes.data);
    }
    if (catRes.success && catRes.data) {
      setCategories([
        { label: 'All Categories', value: 'ALL' },
        ...catRes.data.map((c: any) => ({ label: c.name, value: c._id })),
      ]);
    }
    setLoading(false);
  };

  const handleOpenAdjustment = (item: any) => {
    setAdjustingItem(item);
    setAdjustAmount('');
    if (item.hasVariants && item.variants.length > 0) {
      setSelectedVariantId(item.variants[0]._id);
    } else {
      setSelectedVariantId('');
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotalStock = Number(adjustAmount);
    if (!adjustingItem || isNaN(newTotalStock) || newTotalStock < 0 || adjustAmount === '') return;

    setSavingAdjustment(true);

    let currentStock = 0;
    if (selectedVariantId && adjustingItem.hasVariants) {
      const v = adjustingItem.variants.find((v: any) => v._id === selectedVariantId);
      if (v) currentStock = v.stock;
    } else {
      currentStock = adjustingItem.stock;
    }

    const delta = newTotalStock - currentStock;

    const savePromise = updateStockLevel({
      productId: adjustingItem._id,
      variantId: selectedVariantId || undefined,
      adjustment: delta,
      reason: 'Absolute override from Inventory Admin'
    });

    toast.promise(savePromise, {
      loading: 'Updating stock...',
      success: (res) => {
        if (!res.success) throw new Error(res.error);
        return 'Stock updated successfully!';
      },
      error: (err) => `Failed: ${err.message}`,
    });

    try {
      const res = await savePromise;
      if (res.success) {
        setAdjustingItem(null);
        fetchData();
      }
    } catch (e) {
      // Handled by toast
    } finally {
      setSavingAdjustment(false);
    }
  };

  // Filtered inventory
  const filtered = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-gray-600" />
            Inventory & Stock Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time stock availability, reservation tracking, and inventory adjustments.
          </p>
        </div>
        <AdminButton variant="outline" onClick={fetchData} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </AdminButton>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-slate-900/30 text-gray-600 flex items-center justify-center">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Total Tracked Items</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{inventory.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Low Stock Alerts</p>
            <p className="text-xl font-bold text-amber-600">
              {inventory.filter(i => i.status === 'LOW_STOCK').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Out of Stock</p>
            <p className="text-xl font-bold text-red-600">
              {inventory.filter(i => i.status === 'OUT_OF_STOCK').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-48">
            <AdminSelect
              placeholder="Category"
              options={categories}
              value={categories.find(c => c.value === selectedCategory) || null}
              onChange={(opt: any) => setSelectedCategory(opt ? opt.value : 'ALL')}
            />
          </div>

          <div className="w-44">
            <AdminSelect
              placeholder="Stock Status"
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'In Stock', value: 'IN_STOCK' },
                { label: 'Low Stock', value: 'LOW_STOCK' },
                { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
              ]}
              value={{
                label: statusFilter === 'ALL' ? 'All Statuses' : statusFilter === 'IN_STOCK' ? 'In Stock' : statusFilter === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock',
                value: statusFilter,
              }}
              onChange={(opt: any) => setStatusFilter(opt ? opt.value : 'ALL')}
            />
          </div>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3.5 font-semibold">SKU / Product</th>
                <th className="px-6 py-3.5 font-semibold">Category</th>
                <th className="px-6 py-3.5 font-semibold text-center">Total Stock</th>
                <th className="px-6 py-3.5 font-semibold text-center">Reserved</th>
                <th className="px-6 py-3.5 font-semibold text-center">Available</th>
                <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading live inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {item.name}
                          {item.hasVariants && (
                            <span className="text-[10px] bg-gray-100 dark:bg-slate-900/40 text-gray-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
                              {item.variants.length} VARIANTS
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {item.category}
                    </td>

                    <td className="px-6 py-4 text-center font-medium text-gray-900 dark:text-slate-200">
                      {item.stock}
                    </td>

                    <td className="px-6 py-4 text-center text-amber-600 font-medium">
                      {item.reserved}
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                      {item.available}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenAdjustment(item)}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-slate-900/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowUpDown size={13} />
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Adjust Stock Level</h2>
                <p className="text-xs text-gray-500">{adjustingItem.name}</p>
              </div>
              <button onClick={() => setAdjustingItem(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">

              {/* If item has variants */}
              {adjustingItem.hasVariants && adjustingItem.variants.length > 0 && (
                <div>
                  <AdminSelect
                    label="Select Target Variant *"
                    value={
                      adjustingItem.variants
                        .map((v: any) => ({
                          value: v._id,
                          label: `${v.name} (${v.sku || 'N/A'}) — Current Stock: ${v.stock}`
                        }))
                        .find((o: any) => o.value === selectedVariantId) || null
                    }
                    onChange={(opt: any) => setSelectedVariantId(opt.value)}
                    options={adjustingItem.variants.map((v: any) => ({
                      value: v._id,
                      label: `${v.name} (${v.sku || 'N/A'}) — Current Stock: ${v.stock}`
                    }))}
                  />
                </div>
              )}

              {/* Quantity */}
              <AdminInput
                type="text"
                label="New Total Stock *"
                value={adjustAmount}
                placeholder="e.g. 50"
                onChange={e => setAdjustAmount(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <AdminButton type="button" variant="outline" onClick={() => setAdjustingItem(null)}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" isLoading={savingAdjustment}>
                  Apply Adjustment
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
