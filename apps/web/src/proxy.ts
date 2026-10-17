import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SessionUser, UserRole } from "@/lib/api/types";

const USER_COOKIE = "clinicq_session_user";
const ACCESS_TOKEN_COOKIE = "clinicq_access_token";
const REFRESH_TOKEN_COOKIE = "clinicq_refresh_token";

// Define role-specific home routes
const ROLE_HOMES: Record<UserRole, string> = {
  PATIENT: "/assistant",
  DOCTOR: "/today",
  RECEPTIONIST: "/queue",
  ADMIN: "/dashboard",
};

// Route access definitions
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/book": ["PATIENT", "ADMIN", "RECEPTIONIST"],
  "/assistant": ["PATIENT", "ADMIN", "RECEPTIONIST"],
  "/appointments": ["PATIENT", "ADMIN"],
  "/queue": ["RECEPTIONIST", "ADMIN", "DOCTOR"],
  "/walk-in": ["RECEPTIONIST", "ADMIN"],
  "/today": ["DOCTOR", "ADMIN"],
  "/dashboard": ["ADMIN"],
  "/doctors": ["ADMIN"],
  "/schedules": ["ADMIN"],
  "/knowledge": ["ADMIN"],
  "/agent-traces": ["ADMIN"],
};

function isJwtExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    if (!payload.exp) return false;
    // Buffer with 15 seconds margin
    return payload.exp * 1000 < Date.now() + 15000;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session user cookie and token cookies
  const userCookie = request.cookies.get(USER_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let user: SessionUser | null = null;
  let refreshedAccessToken: string | null = null;
  let refreshedRefreshToken: string | null = null;

  // Only consider authenticated if user cookie AND an active token exist
  if (userCookie && (accessToken || refreshToken)) {
    try {
      user = JSON.parse(userCookie) as SessionUser;
    } catch {
      user = null;
    }
  }

  // If user is authenticated but accessToken is expired, refresh it proactively
  if (user && isJwtExpired(accessToken) && refreshToken) {
    try {
      const apiUrl =
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000/api/v1";
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        refreshedAccessToken = json.data?.accessToken || null;
        refreshedRefreshToken = json.data?.refreshToken || null;
      } else {
        // Refresh token is revoked or expired -> clear session
        user = null;
      }
    } catch {
      // Network failure reaching API, allow downstream to handle
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 1. If authenticated user tries to access /login or /register, redirect to their role home
  if (isAuthPage && user) {
    const homeUrl = new URL(ROLE_HOMES[user.role] || "/", request.url);
    const redirectRes = NextResponse.redirect(homeUrl);
    if (refreshedAccessToken) {
      redirectRes.cookies.set(ACCESS_TOKEN_COOKIE, refreshedAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
    }
    return redirectRes;
  }

  // 2. Check if current route requires authentication or specific roles
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        const redirectRes = NextResponse.redirect(loginUrl);
        // Clear stale session cookies
        redirectRes.cookies.delete(USER_COOKIE);
        redirectRes.cookies.delete(ACCESS_TOKEN_COOKIE);
        redirectRes.cookies.delete(REFRESH_TOKEN_COOKIE);
        return redirectRes;
      }

      if (!allowedRoles.includes(user.role)) {
        // User is logged in but doesn't have required role -> redirect to their role home
        const homeUrl = new URL(ROLE_HOMES[user.role] || "/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  // Forward request with refreshed token if available
  const requestHeaders = new Headers(request.headers);
  if (refreshedAccessToken) {
    request.cookies.set(ACCESS_TOKEN_COOKIE, refreshedAccessToken);
    requestHeaders.set("cookie", request.cookies.toString());
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (refreshedAccessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshedAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    if (refreshedRefreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, refreshedRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
