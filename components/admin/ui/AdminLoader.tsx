"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function AdminLoader({
  message = "Loading data...",
  className,
  size = "md",
}: {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const spinnerSizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 w-full gap-3 text-center",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-gold-200 border-t-gold-600 dark:border-plum-800 dark:border-t-gold-500",
          spinnerSizes[size]
        )}
      />
      {message && (
        <p className="text-xs sm:text-sm font-medium text-plum-600 dark:text-gold-400">
          {message}
        </p>
      )}
    </div>
  );
}
