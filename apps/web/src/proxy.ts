import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SessionUser, UserRole } from "@/lib/api/types";

// User session cookie name
const USER_COOKIE = "clinicq_session_user";

// Define role-specific home routes
const ROLE_HOMES: Record<UserRole, string> = {
  PATIENT: "/assistant",
  DOCTOR: "/today",
  RECEPTIONIST: "/queue",
  ADMIN: "/dashboard",
};

// Route access definitions
const ROLE_ROUTES: Record<string, UserRole[]> = {
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

  // Read session user cookie optimistically for proxy routing
  const userCookie = request.cookies.get(USER_COOKIE)?.value;
  let user: SessionUser | null = null;

  if (userCookie) {
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
