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
  "/queue": ["RECEPTIONIST", "ADMIN"],
  "/walk-in": ["RECEPTIONIST", "ADMIN"],
  "/today": ["DOCTOR", "ADMIN"],
  "/dashboard": ["ADMIN"],
  "/doctors": ["ADMIN"],
  "/schedules": ["ADMIN"],
  "/knowledge": ["ADMIN"],
  "/agent-traces": ["ADMIN"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session user cookie and token cookies
  const userCookie = request.cookies.get(USER_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let user: SessionUser | null = null;

  // Only consider authenticated if user cookie AND an active token exist
  if (userCookie && (accessToken || refreshToken)) {
    try {
      user = JSON.parse(userCookie) as SessionUser;
    } catch {
      user = null;
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 1. If authenticated user tries to access /login or /register, redirect to their role home
  if (isAuthPage && user) {
    const homeUrl = new URL(ROLE_HOMES[user.role] || "/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // 2. Check if current route requires authentication or specific roles
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!allowedRoles.includes(user.role)) {
        // User is logged in but doesn't have required role -> redirect to their role home
        const homeUrl = new URL(ROLE_HOMES[user.role] || "/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
