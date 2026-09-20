"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/public/ui/button";

export function SignOutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    try {
      // Wait for NextAuth to clear the cookie before leaving protected UI.
      const result = await signOut({ redirect: false, callbackUrl: "/login" });
      window.location.assign(result.url);
    } catch {
      setError("Unable to sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={className}
        onClick={handleSignOut}
        disabled={pending}
        aria-busy={pending}
        aria-label="Sign Out"
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut size={18} aria-hidden="true" />
        )}
        {!iconOnly && <span>{pending ? "Signing out..." : "Sign Out"}</span>}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
