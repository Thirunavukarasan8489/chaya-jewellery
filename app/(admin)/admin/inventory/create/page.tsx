import React from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { InventoryForm } from "@/components/admin/inventory/InventoryForm";

export const metadata = {
  title: "Create Inventory | Chaya Jewellery Admin",
};

export default function CreateInventoryPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventory"
          className="p-2 hover:bg-gray-100 dark:hover:bg-plum-900 rounded-full transition-colors text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-plum-900 dark:text-ivory-50 flex items-center gap-2">
            <PlusCircle className="text-gold-500" />
            Create Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Allocate initial stock and configure storage racks for a product.
          </p>
        </div>
      </div>

      <InventoryForm />
    </div>
  );
}
