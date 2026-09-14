/**
 * Reads a secret from the environment, allowing a fallback ONLY outside
 * production. SECURITY: lib/authOptions.ts and proxy.ts used to each
 * independently fall back to the same hardcoded string
 * ("fallback-secret-for-development") when NEXTAUTH_SECRET was unset — one
 * file signs the session JWT with it, the other verifies with it, so a
 * production deploy that forgot to set the env var would let anyone forge a
 * SUPER_ADMIN session cookie using that now-public string. This throws
 * instead, so a missing required secret fails the deploy/request loudly
 * rather than silently degrading to a known value.
 */
export function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${name} must be set in production — refusing to fall back to a hardcoded development secret.`,
    );
  }

  return devFallback;
}
