"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { List } from "lucide-react";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { ProductFormValues } from "../ProductForm";

interface SpecificationsTabProps {
  isActive: boolean;
}

export function SpecificationsTab({ isActive }: SpecificationsTabProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <div className={isActive ? "space-y-6" : "hidden"}>
      <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-200 dark:border-plum-800 pb-3">
        <List size={20} className="text-gold-500" />
        Product Specifications
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminInput
          label="Material"
          placeholder="e.g. Silver"
          {...register("specifications.material")}
          error={errors.specifications?.material?.message}
        />
        <AdminInput
          label="Purity"
          placeholder="e.g. 925"
          {...register("specifications.purity")}
          error={errors.specifications?.purity?.message}
        />
        <AdminInput
          label="Colour"
          placeholder="e.g. Silver"
          {...register("specifications.colour")}
          error={errors.specifications?.colour?.message}
        />
        <AdminInput
          label="Style"
          placeholder="e.g. Bridal"
          {...register("specifications.style")}
          error={errors.specifications?.style?.message}
        />
        <AdminInput
          label="Occasion"
          placeholder="e.g. Wedding"
          {...register("specifications.occasion")}
          error={errors.specifications?.occasion?.message}
        />
        <AdminInput
          label="Stone Type"
          placeholder="e.g. Kundan"
          {...register("specifications.stoneType")}
          error={errors.specifications?.stoneType?.message}
        />
        <AdminInput
          label="Stone Colour"
          placeholder="e.g. Red"
          {...register("specifications.stoneColour")}
          error={errors.specifications?.stoneColour?.message}
        />
        <AdminInput
          label="Collection Name"
          placeholder="e.g. Bridal 2026"
          {...register("specifications.collectionName")}
          error={errors.specifications?.collectionName?.message}
        />
      </div>
    </div>
  );
}
