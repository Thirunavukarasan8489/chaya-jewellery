"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
  onDark?: boolean;
}

export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className,
  onDark = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={cn(
        "group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer py-1.5 px-3 rounded-xl active:scale-95",
        onDark
          ? "text-plum-200 hover:text-gold-300 hover:bg-white/10 border border-white/15 bg-white/5 backdrop-blur-sm"
          : "text-plum-800 hover:text-plum-950 hover:bg-plum-100/80 border border-plum-200/80 bg-white/80 shadow-xs backdrop-blur-sm",
        className
      )}
    >
      <ArrowLeft
        size={14}
        strokeWidth={2.2}
        className="transition-transform duration-200 group-hover:-translate-x-1 shrink-0"
      />
      <span>{label}</span>
    </button>
  );
}
