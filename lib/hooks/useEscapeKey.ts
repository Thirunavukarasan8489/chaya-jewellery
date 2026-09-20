"use client";

import { useEffect } from "react";

/**
 * Calls onClose when Escape is pressed while isActive is true. Used by
 * hand-rolled admin modals (no shared Dialog primitive exists yet) so
 * Escape-to-close behaves consistently across them.
 */
export function useEscapeKey(onClose: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onClose]);
}
