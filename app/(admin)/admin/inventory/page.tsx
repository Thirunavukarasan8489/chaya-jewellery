'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Boxes,
  RefreshCw,
  ArrowUpDown,
  AlertTriangle,
  XCircle,
  X,
  Filter,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import DataTable from '@/components/admin/ui/DataTable';
import { getInventoryList, updateStockLevel, getStockHistory } from '@/lib/actions/inventory.actions';
import { getCategories } from '@/lib/actions/category.actions';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Adjustment Modal State — each inventory row is one ProductVariant, so the
  // modal always adjusts exactly that variant (no variant picker needed).
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  // History Modal State
  const [historyItem, setHistoryItem] = useState<any | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    setAdjustReason('');
  };

  const closeAdjustModal = useCallback(() => {
    setAdjustingItem(null);
    setAdjustAmount('');
    setAdjustReason('');
  }, []);

  useEscapeKey(closeAdjustModal, !!adjustingItem);

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotalStock = Number(adjustAmount);
    if (!adjustingItem || isNaN(newTotalStock) || newTotalStock < 0 || adjustAmount === '') return;

    setSavingAdjustment(true);

    const delta = newTotalStock - adjustingItem.stock;

    const savePromise = updateStockLevel({
      productId: adjustingItem.productId,
      variantId: adjustingItem._id,
      adjustment: delta,
      reason: adjustReason.trim() || 'Absolute override from Inventory Admin',
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
        closeAdjustModal();
        fetchData();
      }
    } catch (e) {
      // Handled by toast
    } finally {
      setSavingAdjustment(false);
    }
  };

  const closeHistoryModal = useCallback(() => {
    setHistoryItem(null);
    setHistoryEntries([]);
    setHistoryPage(1);
    setHistoryTotalPages(1);
  }, []);

  useEscapeKey(closeHistoryModal, !!historyItem);

  const loadHistory = useCallback(async (productId: string, variantId: string, page: number) => {
    setHistoryLoading(true);
    const res = await getStockHistory({ productId, variantId, page, pageSize: 10 });
    if (res.success) {
      setHistoryEntries(res.data || []);
      setHistoryTotalPages(res.totalPages || 1);
      setHistoryPage(res.page || 1);
    } else {
      toast.error(res.error || 'Failed to load stock history');
    }
    setHistoryLoading(false);
  }, []);

  const handleOpenHistory = (item: any) => {
    setHistoryItem(item);
    loadHistory(item.productId, item._id, 1);
  };

  const handleHistoryPageChange = (page: number) => {
    if (!historyItem || page < 1 || page > historyTotalPages) return;
    loadHistory(historyItem.productId, historyItem._id, page);
  };

  // Category / Stock-status filtered inventory (search itself is handled by DataTable)
  const filtered = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [inventory, selectedCategory, statusFilter]);

  const hasActiveFilters = selectedCategory !== 'ALL' || statusFilter !== 'ALL';

  const renderFilter = () => (
    <div className="relative">
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${hasActiveFilters ? 'bg-gold-50 border-gold-300 text-gold-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
      >
        <Filter size={18} />
        {hasActiveFilters && <span className="w-2 h-2 rounded-none bg-emerald-500"></span>}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-2">
            <h4 className="font-semibold text-sm text-plum-900 dark:text-ivory-100">Filter Inventory</h4>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <AdminSelect
              placeholder="Category"
              options={categories}
              value={categories.find(c => c.value === selectedCategory) || null}
              onChange={(opt: any) => setSelectedCategory(opt ? opt.value : 'ALL')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Stock Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 dark:border-plum-700 dark:bg-plum-950 rounded-md"
            >
              <option value="ALL">All Statuses</option>
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
      header: 'Variant / Product',
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.productName}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (item: any) => <span className="text-gray-600 dark:text-slate-300">{item.category}</span>,
    },
    {
      header: 'Stock',
      cell: (item: any) => <span className="font-medium text-gray-900 dark:text-slate-200">{item.stock}</span>,
    },
    {
      header: 'Reserved',
      cell: (item: any) => <span className="text-amber-600 font-medium">{item.reserved}</span>,
    },
    {
      header: 'Available',
      cell: (item: any) => <span className="font-bold text-gray-900 dark:text-white">{item.available}</span>,
    },
    {
      header: 'Status',
      cell: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenHistory(item)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-plum-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <History size={13} />
            History
          </button>
          <button
            onClick={() => handleOpenAdjustment(item)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-plum-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <ArrowUpDown size={13} />
            Adjust Stock
          </button>
        </div>
      ),
    },
  ];

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
            Real-time stock availability, reservation tracking, and per-variant inventory adjustments.
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
            <p className="text-xs font-semibold uppercase text-gray-400">Total Tracked Variants</p>
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

      {/* Inventory Data Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-12 text-center text-gray-400 shadow-sm">
          Loading live inventory...
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={filtered}
          title="Inventory"
          renderFilter={renderFilter}
          getSearchText={(item: any) => [item.name, item.productName, item.sku, item.category].filter(Boolean).join(' ')}
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Adjust Stock Level</h2>
                <p className="text-xs text-gray-500">{adjustingItem.name} — {adjustingItem.productName}</p>
              </div>
              <button onClick={closeAdjustModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <p className="text-xs text-gray-500 -mt-2">Current stock: <span className="font-semibold text-gray-700 dark:text-slate-300">{adjustingItem.stock}</span></p>

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

              <AdminInput
                type="text"
                label="Reason (optional)"
                value={adjustReason}
                placeholder="e.g. Stock recount, damaged goods"
                onChange={e => setAdjustReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <AdminButton type="button" variant="outline" onClick={closeAdjustModal}>
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

      {/* Stock History Modal */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Stock Adjustment History</h2>
                <p className="text-xs text-gray-500">{historyItem.name} — {historyItem.productName}</p>
              </div>
              <button onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Change</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Stock</th>
                    <th className="px-4 py-2.5 font-semibold">Reason</th>
                    <th className="px-4 py-2.5 font-semibold">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading history...</td>
                    </tr>
                  ) : historyEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No stock adjustments recorded yet.</td>
                    </tr>
                  ) : (
                    historyEntries.map((entry) => (
                      <tr key={entry._id}>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className={`px-4 py-2.5 text-center font-semibold whitespace-nowrap ${entry.adjustment >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {entry.adjustment >= 0 ? '+' : ''}{entry.adjustment}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-700 dark:text-slate-300 whitespace-nowrap">
                          {entry.previousStock} → {entry.newStock}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300">{entry.reason || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300 whitespace-nowrap">{entry.createdByName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Page {historyPage} of {historyTotalPages}</span>
              <div className="flex gap-1.5">
                <button
                  disabled={historyPage === 1 || historyLoading}
                  onClick={() => handleHistoryPageChange(historyPage - 1)}
                  className="p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={historyPage === historyTotalPages || historyLoading}
                  onClick={() => handleHistoryPageChange(historyPage + 1)}
                  className="p-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
