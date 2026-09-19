import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function getSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  // SECURITY: fail closed, not open. A missing role/id used to silently
  // default to id "000000000000000000000000" and role CUSTOMER, so any
  // future regression that drops those fields off the JWT would grant a
  // real (if low-privilege) session instead of no session at all — not
  // reachable today since the jwt callback in authOptions.ts always sets
  // both, but this shouldn't rely on that never changing.
  if (!session.user.id || !session.user.role) {
    return null;
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name || 'User',
    email: session.user.email || ''
  };
}
