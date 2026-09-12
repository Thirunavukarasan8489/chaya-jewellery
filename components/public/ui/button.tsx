import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "dark"
  | "outline"
  | "ghost"
  | "emerald"
  | "whatsapp";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "shine-sweep bg-gold-500 text-plum-950 shadow-gold hover:bg-gold-400 active:bg-gold-600 font-semibold",
  dark: "bg-plum-900 text-ivory-100 shadow-md hover:bg-plum-800 active:bg-plum-950",
  outline:
    "border border-plum-900/20 bg-white/70 text-plum-900 hover:border-plum-900/40 hover:bg-white active:bg-ivory-200",
  ghost: "text-plum-700 hover:bg-plum-900/6 active:bg-plum-900/10",
  emerald:
    "bg-emerald-700 text-white shadow-md hover:bg-emerald-600 active:bg-emerald-800 font-semibold",
  whatsapp:
    "bg-[#25D366] text-[#062f16] shadow-md hover:bg-[#1fbc59] font-semibold",
};

const sizes: Record<Size, string> = {
  // 44px minimum height everywhere — the smallest comfortable touch target.
  sm: "h-11 px-4 text-sm gap-1.5",
  md: "h-12 px-5 text-[0.9375rem] gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full whitespace-nowrap",
    "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-[var(--ease-out-soft)]",
    "active:scale-[0.98] touch-manipulation select-none",
    "disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  full,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}) {
  return (
    <button
      {...props}
      className={buttonStyles({ variant, size, full, className })}
    />
  );
}
