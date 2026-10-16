import "server-only";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/config";
import type { SessionUser } from "@/lib/api/types";

export const ACCESS_TOKEN_COOKIE =
  process.env.SESSION_COOKIE_NAME || "clinicq_access_token";
export const REFRESH_TOKEN_COOKIE = "clinicq_refresh_token";
export const USER_COOKIE = "clinicq_session_user";

// 7 days in seconds for refresh token cookie
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
// 15 minutes in seconds for access token cookie
const ACCESS_COOKIE_MAX_AGE = 15 * 60;

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(
  accessToken: string,
  refreshToken: string,
  user: SessionUser
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getCookieOptions(ACCESS_COOKIE_MAX_AGE)
  );

  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getCookieOptions(REFRESH_COOKIE_MAX_AGE)
  );

  cookieStore.set(
    USER_COOKIE,
    JSON.stringify(user),
    getCookieOptions(REFRESH_COOKIE_MAX_AGE)
  );
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);
}

/**
 * Attempts to refresh the session server-side using the refresh token cookie.
 * Returns the new access token if successful, or null on failure.
 */
export async function refreshServerSession(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSession();
    return null;
  }

    try {
      const res = await fetch(getApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      await clearSession();
      return null;
    }

    const json = await res.json();
    const newAccessToken = json.data?.accessToken;
    const newRefreshToken = json.data?.refreshToken;
    const user = await getSessionUser();

    if (newAccessToken && user) {
      await setSession(newAccessToken, newRefreshToken || refreshToken, user);
      return newAccessToken;
    }

    return null;
  } catch {
    return null;
  }
}
