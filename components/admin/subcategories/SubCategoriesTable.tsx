"use client";

import { useState, useMemo } from "react";
import DataTable from "@/components/admin/ui/DataTable";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { Edit, Filter } from "lucide-react";
import Link from "next/link";
import { deleteSubCategory } from "@/lib/actions/sub-category.actions";
import DeleteConfirmButton from "@/components/admin/ui/DeleteConfirmButton";
import { CldImage } from "@/components/shared/CldImage";

type SubCategoryRow = {
  _id: string;
  name: string;
  slug: string;
  type?: "SINGLE" | "COMBO";
  category?: { _id: string; name: string };
  status?: "ACTIVE" | "DRAFT";
  image?: string;
  productCount?: number;
};

export default function SubCategoriesTable({
  subCategories,
}: {
  subCategories: SubCategoryRow[];
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredSubCategories = useMemo(() => {
    return subCategories.filter((c) => {
      if (statusFilter && (c.status ?? "DRAFT") !== statusFilter) return false;
      if (typeFilter && (c.type ?? "SINGLE") !== typeFilter) return false;
      return true;
    });
  }, [subCategories, statusFilter, typeFilter]);

  const renderFilter = () => (
    <div className="relative">
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${filterOpen || statusFilter || typeFilter ? "bg-gold-50 border-gold-300 text-gold-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
      >
        <Filter size={18} />
        {(statusFilter || typeFilter) && (
          <span className="w-2 h-2 rounded-none bg-emerald-500"></span>
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">Filter SubCategories</h4>
            <button
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Types</option>
              <option value="SINGLE">Single</option>
              <option value="COMBO">Combo</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const columns = [
    {
      header: "Image",
      cell: (item: SubCategoryRow) => (
        <div className="w-10 h-10 bg-gold-100 dark:bg-gold-800 rounded-md overflow-hidden flex-shrink-0 border border-gold-200 dark:border-gold-700">
          {item.image ? (
            <CldImage
              src={item.image}
              alt={item.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-400 text-xs">
              No img
            </div>
          )}
        </div>
      ),
    },
    {
      header: "SubCategory Name",
      cell: (item: SubCategoryRow) => (
        <div>
          <p className="font-medium text-gold-800 dark:text-gold-200">
            {item.name}
          </p>
          <p className="text-xs text-gold-500 dark:text-gold-400">
            /{item.slug}
          </p>
        </div>
      ),
    },
    {
      header: "Parent Category",
      cell: (item: SubCategoryRow) => (
        <span className="text-gold-700 dark:text-gold-300">
          {item.category?.name || "Unknown"}
        </span>
      ),
    },
    {
      header: "Type",
      cell: (item: SubCategoryRow) => (
        <StatusBadge
          label={item.type || "SINGLE"}
          variant={item.type === "COMBO" ? "success" : "neutral"}
        />
      ),
    },
    {
      header: "Products",
      cell: (item: SubCategoryRow) => (
        <span className="text-gold-700 dark:text-gold-300">
          {item.productCount ?? 0}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item: SubCategoryRow) => {
        const isActive = item.status === "ACTIVE";
        return (
          <StatusBadge
            label={isActive ? "Active" : "Draft"}
            variant={isActive ? "success" : "neutral"}
          />
        );
      },
    },
    {
      header: "Actions",
      cell: (item: SubCategoryRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/subcategories/${item._id}/edit`}
            className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            <Edit size={16} />
          </Link>
          <DeleteConfirmButton
            entityId={item._id}
            entityName={item.name}
            deleteAction={deleteSubCategory}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="All SubCategories"
      columns={columns}
      data={filteredSubCategories}
      renderFilter={renderFilter}
    />
  );
}
