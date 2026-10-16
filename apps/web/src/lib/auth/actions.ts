"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSession, clearSession, getRefreshToken } from "./session";
import { loginInputSchema, registerInputSchema } from "./validation";
import type { SessionUser, UserRole } from "@/lib/api/types";
import { getApiBaseUrl } from "@/lib/api/client";

export type ActionState<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  issues?: Record<string, string[]>;
  data?: T;
};

const ROLE_DEFAULT_PAGES: Record<UserRole, string> = {
  PATIENT: "/assistant",
  DOCTOR: "/today",
  RECEPTIONIST: "/queue",
  ADMIN: "/dashboard",
};

/**
 * Server Action: Authenticate user, set session cookies, and return target destination.
 */
export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ redirectTo: string }>> {
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const from = formData.get("from")?.toString() || "";

  const parsed = loginInputSchema.safeParse({ email, password, from });
  if (!parsed.success) {
    const issues: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!issues[key]) issues[key] = [];
      issues[key].push(issue.message);
    }
    return {
      success: false,
      error: "Please check the entered credentials",
      issues,
    };
  }

  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      return {
        success: false,
        error: json?.message || "Invalid email or password",
        issues: json?.issues,
      };
    }

    const { user, accessToken, refreshToken } = json.data;

    // Determine user display name
    const displayName =
      user.doctorProfile?.name ||
      user.patientProfile?.name ||
      user.email.split("@")[0];

    const sessionUser: SessionUser = {
      id: user.id,
      name: displayName,
      email: user.email,
      role: user.role as UserRole,
      clinicId: user.clinicId,
      phone: user.patientProfile?.phone ?? null,
    };

    await setSession(accessToken, refreshToken, sessionUser);

    // If a redirect destination was requested and matches the role permissions, respect it
    let target = parsed.data.from;
    if (!target || target === "/login" || target === "/register") {
      target = ROLE_DEFAULT_PAGES[sessionUser.role] || "/";
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Logged in successfully",
      data: { redirectTo: target },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error during authentication",
    };
  }
}

/**
 * Server Action: Register new patient and log them in automatically.
 */
export async function registerAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ redirectTo: string }>> {
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const phone = formData.get("phone")?.toString() || "";
  const preferredLanguage = formData.get("preferredLanguage")?.toString() || "en";

  const parsed = registerInputSchema.safeParse({
    email,
    password,
    phone: phone || undefined,
    preferredLanguage,
  });

  if (!parsed.success) {
    const issues: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!issues[key]) issues[key] = [];
      issues[key].push(issue.message);
    }
    return {
      success: false,
      error: "Please fix the errors below",
      issues,
    };
  }

  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      return {
        success: false,
        error: json?.message || "Registration failed",
        issues: json?.issues,
      };
    }

    const { user, accessToken, refreshToken } = json.data;

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.email.split("@")[0],
      email: user.email,
      role: user.role as UserRole,
      clinicId: user.clinicId,
      phone: parsed.data.phone || null,
    };

    await setSession(accessToken, refreshToken, sessionUser);
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Account created successfully",
      data: { redirectTo: "/assistant" },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error during registration",
    };
  }
}

/**
 * Server Action: Log user out, invalidate refresh token on backend, and clear cookies.
 */
export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    const apiUrl = getApiBaseUrl();
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Invalidation best-effort; always clear cookies
    }
  }

  await clearSession();
  revalidatePath("/", "layout");
  redirect("/login");
}
