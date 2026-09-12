import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
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

  const isPublicProtectedRoute = pathname.startsWith("/account"); // Removed /checkout from strictly CUSTOMER

  // Protection logic for /account routes
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
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/checkout", "/login", "/register", "/forgot-password", "/reset-password"],
};
