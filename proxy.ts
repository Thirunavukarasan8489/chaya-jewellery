import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { requireSecret } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // SECURITY: nothing throttled login or registration — see lib/rate-limit.ts
  // for why this is a simple per-instance limiter rather than a distributed
  // one. Both admin and customer credential logins go through this same
  // NextAuth callback route.
  if (req.method === "POST") {
    if (pathname === "/api/auth/callback/credentials") {
      const ip = getClientIp(req);
      if (!checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
        return new NextResponse("Too many login attempts. Please try again in a few minutes.", {
          status: 429,
        });
      }
    } else if (pathname === "/api/auth/register") {
      const ip = getClientIp(req);
      if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
        return new NextResponse("Too many registration attempts. Please try again later.", {
          status: 429,
        });
      }
    }
  }

  const token = await getToken({
    req,
    secret: requireSecret("NEXTAUTH_SECRET", "fallback-secret-for-development"),
  });

  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/reset-password");

  const isProtectedRoute = pathname.startsWith("/admin") && !isAuthRoute;

  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");



  // Protection logic for /admin routes
  if (isProtectedRoute) {
    if (!token) {
      if (
        req.headers.get("next-action") ||
        req.headers.get("x-action") ||
        pathname.startsWith("/api/")
      ) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const validAdminRoles = ["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"];
    if (!validAdminRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      pathname.startsWith("/admin/system") ||
      pathname.startsWith("/admin/settings")
    ) {
      if (token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
  }

  // Guest checkout is no longer allowed — /checkout now requires a signed-in
  // CUSTOMER, same as /account/*.
  const isPublicProtectedRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout");

  // Protection logic for /account and /checkout routes
  if (isPublicProtectedRoute) {
    if (!token || token.role !== "CUSTOMER") {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }
  }

  // Skip the DB recheck on the auth pages themselves (/login, /admin/login,
  // /register, /forgot-password, /reset-password, ...). Without this, a
  // failed verify redirects here, the same token gets rechecked on THIS
  // page, fails again, and produces a self-referencing redirect loop
  // (e.g. /login?callbackUrl=%2Flogin) that never lets the user reach the
  // login form to re-authenticate.
  if (token && !isAuthRoute && !isPublicAuthRoute) {
    try {
      const verifyRes = await fetch(`${req.nextUrl.origin}/api/auth/verify?email=${encodeURIComponent(token.email as string)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (!verifyRes.ok) {
        // User not found or inactive. Redirect to login AND clear the
        // stale session cookie — otherwise the browser keeps sending the
        // same invalid token on every subsequent request, and every route
        // it can reach re-triggers this same failure.
        const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
        const callbackUrl = encodeURIComponent(pathname);
        const response = NextResponse.redirect(new URL(`${loginPath}?callbackUrl=${callbackUrl}`, req.url));
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
      }
    } catch (e) {
      console.error("Proxy DB verify failed:", e);
      // Fail open or let it proceed if DB check fails due to network
    }
  }

  // Redirect authenticated admins away from auth pages to dashboard
  if (isAuthRoute && token) {
    const validAdminRoles = ["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER"];
    if (validAdminRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // Handle public auth routes for logged in users
  if (isPublicAuthRoute && token) {
    if (token.role === "CUSTOMER") {
      // Customers go to their portal
      return NextResponse.redirect(new URL("/account/dashboard", req.url));
    } else {
      // Admins shouldn't be at /login, send them to their dashboard
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    // Rate-limited only (see the POST check above) — every other branch in
    // this function is a no-op for these two paths since neither matches
    // isProtectedRoute/isPublicAuthRoute/etc.
    "/api/auth/callback/credentials",
    "/api/auth/register",
  ],
};
