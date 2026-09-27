"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  PlusCircle,
  Plus,
  Minus,
  CheckCircle2,
  PackageCheck,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import DataTable from "@/components/admin/ui/DataTable";
import { AdminLoader } from "@/components/admin/ui/AdminLoader";
import {
  getInventoryList,
  updateStockLevel,
  getStockHistory,
  getInventoryRacks,
} from "@/lib/actions/inventory.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import toast from "react-hot-toast";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustMode, setAdjustMode] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [adjustQty, setAdjustQty] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustRacks, setAdjustRacks] = useState<any[]>([]);
  const [selectedTargetRack, setSelectedTargetRack] = useState<string>("");
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  // History Modal State
  const [historyItem, setHistoryItem] = useState<any | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Rack Details Modal State
  const [rackItem, setRackItem] = useState<any | null>(null);
  const [rackData, setRackData] = useState<{
    product: any;
    inventory: any;
    racks: any[];
  } | null>(null);
  const [rackLoading, setRackLoading] = useState(false);

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
        { label: "All Categories", value: "ALL" },
        ...catRes.data.map((c: any) => ({ label: c.name, value: c._id })),
      ]);
    }
    setLoading(false);
  }

  const handleOpenAdjustment = async (item: any) => {
    setAdjustingItem(item);
    setAdjustMode("INCREASE");
    setAdjustQty("");
    setAdjustReason("");
    setSelectedTargetRack("");
    setAdjustRacks([]);

    const res = await getInventoryRacks(item.productId);
    if (res.success && res.data?.racks) {
      setAdjustRacks(res.data.racks);
    }
  };

  const closeAdjustModal = useCallback(() => {
    setAdjustingItem(null);
    setAdjustQty("");
    setAdjustReason("");
    setSelectedTargetRack("");
    setAdjustRacks([]);
  }, []);

  useEscapeKey(closeAdjustModal, !!adjustingItem);

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(adjustQty);
    if (!adjustingItem || isNaN(qtyNum) || qtyNum <= 0 || adjustQty === "") {
      return toast.error("Please enter a valid positive quantity");
    }

    const currentStock = Number(adjustingItem.stock) || 0;
    if (adjustMode === "DECREASE" && qtyNum > currentStock) {
      return toast.error(`Cannot decrease stock by ${qtyNum}. Only ${currentStock} units available.`);
    }

    const delta = adjustMode === "INCREASE" ? qtyNum : -qtyNum;
    setSavingAdjustment(true);

    const defaultReason =
      adjustMode === "INCREASE"
        ? "Stock addition / replenishment"
        : "Stock reduction / damaged / audit adjustment";

    const savePromise = updateStockLevel({
      productId: adjustingItem.productId,
      adjustment: delta,
      reason: adjustReason.trim() || defaultReason,
      rackId: selectedTargetRack || undefined,
    });

    toast.promise(savePromise, {
      loading: "Updating stock...",
      success: (res) => {
        if (!res.success) throw new Error(res.error);
        return `Stock ${adjustMode === "INCREASE" ? "increased" : "decreased"} by ${qtyNum} units!`;
      },
      error: (err) => `Failed: ${err.message}`,
    });

    try {
      const res = await savePromise;
      if (res.success) {
        fetchData();
      }
    } catch {
      // Handled by toast
    } finally {
      setSavingAdjustment(false);
      closeAdjustModal();
    }
  };

  const closeHistoryModal = useCallback(() => {
    setHistoryItem(null);
    setHistoryEntries([]);
    setHistoryPage(1);
    setHistoryTotalPages(1);
  }, []);

  useEscapeKey(closeHistoryModal, !!historyItem);

  const loadHistory = useCallback(
    async (productId: string, page: number) => {
      setHistoryLoading(true);
      const res = await getStockHistory({
        productId,
        page,
        pageSize: 10,
      });
      if (res.success) {
        setHistoryEntries(res.data || []);
        setHistoryTotalPages(res.totalPages || 1);
        setHistoryPage(res.page || 1);
      } else {
        toast.error(res.error || "Failed to load stock history");
      }
      setHistoryLoading(false);
    },
    [],
  );

  const handleOpenHistory = (item: any) => {
    setHistoryItem(item);
    loadHistory(item.productId, 1);
  };

  const handleHistoryPageChange = (page: number) => {
    if (!historyItem || page < 1 || page > historyTotalPages) return;
    loadHistory(historyItem.productId, page);
  };

  // Rack details modal handler
  const handleOpenRackDetails = async (item: any) => {
    setRackItem(item);
    setRackLoading(true);
    setRackData(null);
    const res = await getInventoryRacks(item.productId);
    if (res.success && res.data) {
      setRackData(res.data);
    } else {
      toast.error(res.error || "Failed to load rack details");
    }
    setRackLoading(false);
  };

  const closeRackModal = useCallback(() => {
    setRackItem(null);
    setRackData(null);
  }, []);

  useEscapeKey(closeRackModal, !!rackItem);

  // Category / Stock-status filtered inventory (search itself is handled by DataTable)
  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" || item.categoryId === selectedCategory;
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [inventory, selectedCategory, statusFilter]);

  const hasActiveFilters = selectedCategory !== "ALL" || statusFilter !== "ALL";

  const renderFilter = () => (
    <div className="relative">
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${
          hasActiveFilters
            ? "bg-gold-50 border-gold-300 text-gold-700 dark:bg-plum-900 dark:border-gold-500 dark:text-gold-400"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-plum-700 dark:text-plum-300 dark:hover:bg-plum-900"
        }`}
      >
        <Filter size={18} />
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-2">
            <h4 className="font-semibold text-sm text-plum-900 dark:text-ivory-100">
              Filter Inventory
            </h4>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-plum-400">
              Category
            </label>
            <AdminSelect
              placeholder="Category"
              options={categories}
              value={
                categories.find((c) => c.value === selectedCategory) || null
              }
              onChange={(opt: any) =>
                setSelectedCategory(opt ? opt.value : "ALL")
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-plum-400">
              Stock Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 dark:border-plum-700 dark:bg-plum-950 rounded-md p-2 text-plum-900 dark:text-ivory-100"
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
      header: "Product",
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-plum-900 dark:text-white">
            {item.productName}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (item: any) => (
        <span className="text-plum-700 dark:text-plum-300">
          {item.category}
        </span>
      ),
    },
    {
      header: "Stock",
      cell: (item: any) => (
        <span className="font-medium text-plum-900 dark:text-slate-200">
          {item.stock}
        </span>
      ),
    },
    {
      header: "Reserved",
      cell: (item: any) => (
        <span className="text-amber-600 font-medium">{item.reserved}</span>
      ),
    },
    {
      header: "Available",
      cell: (item: any) => (
        <span className="font-bold text-plum-900 dark:text-white">
          {item.available}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenHistory(item)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-plum-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-plum-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <History size={13} />
            History
          </button>
          <button
            onClick={() => handleOpenAdjustment(item)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-plum-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-plum-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <ArrowUpDown size={13} />
            Adjustment
          </button>
          <button
            onClick={() => handleOpenRackDetails(item)}
            className="px-3 py-1.5 bg-gold-50 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 hover:bg-gold-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-gold-200 dark:border-gold-800/60"
          >
            <Boxes size={13} />
            View Rack Details
          </button>
        </div>
      ),
    },
  ];

  const currentStockVal = adjustingItem ? Number(adjustingItem.stock) || 0 : 0;
  const parsedAdjustQty = Number(adjustQty) || 0;
  const calculatedNewStock =
    adjustMode === "INCREASE"
      ? currentStockVal + parsedAdjustQty
      : currentStockVal - parsedAdjustQty;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-plum-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-gold-500" />
            Inventory & Stock Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time stock availability, reservation tracking, and product-level inventory adjustments.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link href="/admin/inventory/create">
            <AdminButton className="gap-2">
              <PlusCircle size={16} />
              Create Inventory
            </AdminButton>
          </Link>
          <AdminButton
            variant="outline"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </AdminButton>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-plum-50 dark:bg-plum-900 text-plum-600 dark:text-gold-400 flex items-center justify-center">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Total Tracked Products
            </p>
            <p className="text-xl font-bold text-plum-900 dark:text-white">
              {inventory.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Low Stock Alerts
            </p>
            <p className="text-xl font-bold text-amber-600">
              {inventory.filter((i) => i.status === "LOW_STOCK").length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Out of Stock
            </p>
            <p className="text-xl font-bold text-red-600">
              {inventory.filter((i) => i.status === "OUT_OF_STOCK").length}
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Data Table */}
      {loading ? (
        <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-xl p-8 shadow-sm">
          <AdminLoader message="Loading live inventory stock..." />
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={filtered}
          title="Inventory"
          renderFilter={renderFilter}
          getSearchText={(item: any) =>
            [item.name, item.productName, item.sku, item.category]
              .filter(Boolean)
              .join(" ")
          }
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-plum-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-plum-950 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-plum-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-plum-900 dark:text-white flex items-center gap-2">
                  <ArrowUpDown size={18} className="text-gold-500" />
                  Adjust Stock Quantity
                </h2>
                <p className="text-xs text-gray-500 dark:text-plum-400">
                  {adjustingItem.productName} ({adjustingItem.sku})
                </p>
              </div>
              <button
                onClick={closeAdjustModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-plum-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Current Stock Banner */}
              <div className="bg-plum-50 dark:bg-plum-900/40 p-3.5 rounded-xl border border-plum-100 dark:border-plum-800 flex items-center justify-between">
                <span className="text-xs font-medium text-plum-600 dark:text-plum-300">
                  Current Stock on Record:
                </span>
                <span className="text-base font-bold text-plum-900 dark:text-white">
                  {currentStockVal} units
                </span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-plum-400 block mb-2">
                  Choose Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("INCREASE")}
                    className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all border ${
                      adjustMode === "INCREASE"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-plum-900 text-emerald-700 dark:text-emerald-400 border-gray-200 dark:border-plum-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    Increase Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("DECREASE")}
                    className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all border ${
                      adjustMode === "DECREASE"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white dark:bg-plum-900 text-rose-700 dark:text-rose-400 border-gray-200 dark:border-plum-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    <Minus size={15} strokeWidth={2.5} />
                    Decrease Stock (-)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <AdminInput
                type="text"
                label={`${adjustMode === "INCREASE" ? "Quantity to Add" : "Quantity to Deduct"} *`}
                value={adjustQty}
                placeholder="e.g. 10"
                onChange={(e) => setAdjustQty(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />

              {/* Target Rack Selector (Auto or Specific) */}
              {adjustRacks.length > 0 && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-plum-400 block mb-1.5">
                    Rack Allocation Mode
                  </label>
                  <select
                    value={selectedTargetRack}
                    onChange={(e) => setSelectedTargetRack(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-plum-700 bg-white dark:bg-plum-950 px-3.5 py-2.5 text-xs text-plum-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">⚡ Auto-Allocate Across Racks (Smart Flow)</option>
                    {adjustRacks.map((r: any) => (
                      <option key={r._id} value={r._id}>
                        Rack #{r.rackNumber} ({r.quantity}/{r.capacity} units) - {r.status}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {selectedTargetRack
                      ? "Adjustment will apply directly to the selected rack."
                      : "Smart auto-allocation will automatically fill or drain racks sequentially based on capacity."}
                  </p>
                </div>
              )}

              {/* Live Result Calculation Preview */}
              {parsedAdjustQty > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    calculatedNewStock < 0
                      ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      : "bg-gold-50/70 border-gold-200 text-plum-900 dark:bg-plum-900 dark:border-gold-800/60 dark:text-ivory-100"
                  }`}
                >
                  <span className="font-medium">
                    {currentStockVal} {adjustMode === "INCREASE" ? "+" : "-"} {parsedAdjustQty} =
                  </span>
                  <span className="font-bold text-sm">
                    {calculatedNewStock < 0 ? "Invalid (Negative)" : `${calculatedNewStock} units total`}
                  </span>
                </div>
              )}

              {/* Reason */}
              <AdminInput
                type="text"
                label="Reason for Adjustment"
                value={adjustReason}
                placeholder={
                  adjustMode === "INCREASE"
                    ? "e.g. Stock shipment received, restocked return"
                    : "e.g. Damaged piece, audit reconciliation, quality rejection"
                }
                onChange={(e) => setAdjustReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-plum-800">
                <AdminButton
                  type="button"
                  variant="outline"
                  onClick={closeAdjustModal}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="submit"
                  isLoading={savingAdjustment}
                  disabled={parsedAdjustQty <= 0 || calculatedNewStock < 0}
                >
                  Confirm {adjustMode === "INCREASE" ? "Addition" : "Deduction"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Rack Details Modal */}
      {rackItem && (
        <div className="fixed inset-0 z-50 bg-plum-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-plum-950 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-plum-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-plum-900 dark:text-white flex items-center gap-2">
                  <Boxes size={18} className="text-gold-500" />
                  Storage Rack Breakdown
                </h2>
                <p className="text-xs text-gray-500 dark:text-plum-400">
                  {rackItem.productName} ({rackItem.sku})
                </p>
              </div>
              <button
                onClick={closeRackModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-plum-200"
              >
                <X size={18} />
              </button>
            </div>

            {rackLoading ? (
              <div className="py-8">
                <AdminLoader message="Loading rack allocations..." />
              </div>
            ) : rackData ? (
              <div className="space-y-4">
                {/* Summary Info Header */}
                <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-plum-900/40 p-3 rounded-xl border border-gray-100 dark:border-plum-800 text-xs">
                  <div>
                    <span className="text-gray-400 block">Total Stock</span>
                    <span className="font-bold text-sm text-plum-900 dark:text-white">
                      {rackData.inventory?.availableStock ?? rackItem.stock} units
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Rack Capacity</span>
                    <span className="font-bold text-sm text-plum-900 dark:text-white">
                      {rackData.inventory?.rackCapacity ?? 50} / rack
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Allocated Racks</span>
                    <span className="font-bold text-sm text-gold-600 dark:text-gold-400">
                      {rackData.racks.length} rack(s)
                    </span>
                  </div>
                </div>

                {/* Rack Grid */}
                {rackData.racks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No storage racks allocated yet for this product.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {rackData.racks.map((rack) => {
                      const fillPct = Math.min(100, Math.round((rack.quantity / (rack.capacity || 50)) * 100));
                      const isFull = rack.status === "FULL" || fillPct >= 100;

                      return (
                        <div
                          key={rack._id}
                          className="bg-white dark:bg-plum-900 p-4 rounded-xl border border-gray-200 dark:border-plum-800 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-plum-900 dark:text-ivory-100 flex items-center gap-1.5">
                              <Layers size={14} className="text-gold-500" />
                              Rack #{rack.rackNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isFull
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}
                            >
                              {rack.status || (isFull ? "FULL" : "AVAILABLE")}
                            </span>
                          </div>

                          <div className="text-xs text-gray-400 font-mono">
                            {rack.internalProductCode}
                          </div>

                          {/* Capacity Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-plum-300">
                              <span>Occupancy</span>
                              <span className="font-semibold text-plum-900 dark:text-white">
                                {rack.quantity} / {rack.capacity} ({fillPct}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-plum-950 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all rounded-full ${
                                  isFull
                                    ? "bg-rose-500"
                                    : fillPct > 75
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-plum-800">
              <AdminButton variant="outline" onClick={closeRackModal}>
                Close
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-plum-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-plum-950 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-plum-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-plum-900 dark:text-white">
                  Stock Adjustment History
                </h2>
                <p className="text-xs text-gray-500 dark:text-plum-400">
                  {historyItem.name} — {historyItem.productName}
                </p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-plum-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border border-gray-100 dark:border-plum-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-plum-900 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold text-center">
                      Change
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-center">
                      Stock
                    </th>
                    <th className="px-4 py-2.5 font-semibold">Reason</th>
                    <th className="px-4 py-2.5 font-semibold">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-plum-800">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        <AdminLoader message="Loading stock history..." size="sm" />
                      </td>
                    </tr>
                  ) : historyEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No stock adjustments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    historyEntries.map((entry) => (
                      <tr key={entry._id}>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-center font-semibold whitespace-nowrap text-xs ${
                            entry.adjustment >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {entry.adjustment >= 0 ? "+" : ""}
                          {entry.adjustment}
                        </td>
                        <td className="px-4 py-2.5 text-center text-plum-900 dark:text-slate-300 whitespace-nowrap text-xs">
                          {entry.previousStock} → {entry.newStock}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300 text-xs">
                          {entry.reason || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300 whitespace-nowrap text-xs">
                          {entry.createdByName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-plum-400">
                Page {historyPage} of {historyTotalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={historyPage === 1 || historyLoading}
                  onClick={() => handleHistoryPageChange(historyPage - 1)}
                  className="p-1.5 border border-gray-200 dark:border-plum-700 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-plum-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={historyPage === historyTotalPages || historyLoading}
                  onClick={() => handleHistoryPageChange(historyPage + 1)}
                  className="p-1.5 border border-gray-200 dark:border-plum-700 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-plum-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
