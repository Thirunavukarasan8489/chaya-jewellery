import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "emerald" | "plum" | "danger" | "warning" | "neutral";

const tones: Record<Tone, string> = {
  gold: "bg-gold-100 text-gold-800 ring-gold-500/25",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  plum: "bg-plum-900 text-ivory-100 ring-plum-900/20",
  danger: "bg-danger-50 text-danger-700 ring-danger-500/25",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/30",
  neutral: "bg-ivory-200 text-plum-700 ring-plum-900/10",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase ring-1 ring-inset",
        tones[tone],
        className,
      )}
    />
  );
}
