"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { createInventory, getProductsWithoutInventory } from "@/lib/actions/inventory.actions";
import { toast } from "react-hot-toast";

export function InventoryForm() {
  const router = useRouter();
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [productId, setProductId] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [rackCapacity, setRackCapacity] = useState("50");

  useEffect(() => {
    async function fetchProducts() {
      const res = await getProductsWithoutInventory();
      if (res.success && res.data) {
        setProducts(
          res.data.map((p: any) => ({
            value: p._id,
            label: `${p.name} (${p.productCode})`,
          }))
        );
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return toast.error("Please select a product");
    if (!openingStock || Number(openingStock) < 0) return toast.error("Invalid opening stock");
    if (!rackCapacity || Number(rackCapacity) < 1) return toast.error("Rack capacity must be at least 1");

    setSubmitting(true);
    const res = await createInventory({
      productId,
      openingStock: Number(openingStock),
      lowStockThreshold: Number(lowStockThreshold),
      rackCapacity: Number(rackCapacity),
    });

    if (res.success) {
      toast.success("Inventory created successfully");
      router.push("/admin/inventory");
    } else {
      toast.error(res.error || "Failed to create inventory");
      setSubmitting(false);
    }
  };

  // Rack Preview Calculation
  const parsedStock = Number(openingStock) || 0;
  const parsedCap = Number(rackCapacity) || 1;
  const numRacks = Math.ceil(parsedStock / parsedCap) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-plum-800 space-y-6">
        <div>
          <AdminSelect
            label="Product *"
            placeholder={loading ? "Loading products..." : "Select Product"}
            options={products}
            value={products.find(p => p.value === productId) || null}
            onChange={(opt: any) => setProductId(opt ? opt.value : "")}
            isDisabled={loading || submitting}
          />
          {products.length === 0 && !loading && (
            <p className="text-sm text-red-500 mt-2">All products currently have an inventory record.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminInput
            label="Opening Stock *"
            type="number"
            min="0"
            required
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
          />
          <AdminInput
            label="Low Stock Threshold *"
            type="number"
            min="0"
            required
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />
          <AdminInput
            label="Rack Capacity *"
            type="number"
            min="1"
            required
            value={rackCapacity}
            onChange={(e) => setRackCapacity(e.target.value)}
          />
        </div>
      </div>

      {parsedStock > 0 && (
        <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-plum-800">
          <h3 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 mb-4">
            Rack Allocation Preview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This will automatically create {numRacks} rack(s) based on your configuration.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-plum-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Rack Number</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Quantity</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Capacity</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numRacks }).map((_, idx) => {
                  const rackNum = idx + 1;
                  const stockInThisRack =
                    rackNum === numRacks && parsedStock % parsedCap !== 0
                      ? parsedStock % parsedCap
                      : parsedCap;
                  const status = stockInThisRack === parsedCap ? "FULL" : "AVAILABLE";

                  return (
                    <tr key={idx} className="border-b border-gray-100 dark:border-plum-800/50">
                      <td className="py-3 px-4 text-sm font-medium dark:text-ivory-100">Rack {rackNum}</td>
                      <td className="py-3 px-4 text-sm dark:text-ivory-100">{stockInThisRack}</td>
                      <td className="py-3 px-4 text-sm dark:text-ivory-100">{parsedCap}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${status === "FULL" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <AdminButton variant="outline" type="button" onClick={() => router.push("/admin/inventory")}>
          Cancel
        </AdminButton>
        <AdminButton type="submit" disabled={submitting || products.length === 0}>
          {submitting ? "Creating..." : "Create Inventory"}
        </AdminButton>
      </div>
    </form>
  );
}
