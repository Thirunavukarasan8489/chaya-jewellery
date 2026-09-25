"use client";

import React, { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Layers } from "lucide-react";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { ProductFormValues } from "../ProductForm";

const PRICE_CODE_MAP: Record<string, string> = {
  "0": "q",
  "1": "m",
  "2": "a",
  "3": "z",
  "4": "r",
  "5": "t",
  "6": "k",
  "7": "p",
  "8": "l",
  "9": "x",
};

function generatePriceCode(price: number): string {
  if (price === undefined || price === null || isNaN(price)) return "";
  const priceStr = Math.round(price).toString();
  return priceStr
    .split("")
    .map((char) => PRICE_CODE_MAP[char] || char)
    .join("");
}

export function WeightAndPriceTab({ isActive }: { isActive: boolean }) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  // Auto-generate price code from price
  const price = useWatch({ control, name: "price" });
  useEffect(() => {
    if (price !== undefined && price !== null) {
      const code = generatePriceCode(Number(price));
      setValue("priceCode", code, { shouldValidate: true, shouldDirty: true });
    }
  }, [price, setValue]);

  return (
    <div className={isActive ? "space-y-5" : "hidden"}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-plum-800 pb-3">
        <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gold-500" />
          Weight & Price
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <AdminInput
          label="Gross Weight (g)"
          type="text"
          placeholder="e.g. 15.5"
          {...register("grossWeight")}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!/[0-9.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          error={errors.grossWeight?.message}
        />
        <AdminInput
          label="Net Weight (g)"
          type="text"
          placeholder="e.g. 14.0"
          {...register("netWeight")}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!/[0-9.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          error={errors.netWeight?.message}
        />
        <AdminInput
          label="Stone Weight (g)"
          type="text"
          placeholder="e.g. 1.5"
          {...register("stoneWeight")}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!/[0-9.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          error={errors.stoneWeight?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminInput
          label="Selling Price (₹) *"
          type="text"
          placeholder="e.g. 5000"
          {...register("price")}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!/[0-9.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          error={errors.price?.message}
        />
        <AdminInput
          label="Price Code"
          type="text"
          placeholder="Auto-generated"
          disabled
          className="bg-gray-50 text-gray-500"
          {...register("priceCode")}
          error={errors.priceCode?.message}
        />
      </div>
    </div>
  );
}

