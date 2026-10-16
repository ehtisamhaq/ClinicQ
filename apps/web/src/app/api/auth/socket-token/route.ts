import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth/session";
import { getApiBaseUrl } from "@/lib/api/client";

export async function POST() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: No active session" },
      { status: 401 }
    );
  }

  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/auth/socket-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      return NextResponse.json(
        { success: false, message: json?.message || "Failed to generate socket token" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: json.data,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal error generating socket token",
      },
      { status: 500 }
    );
  }
}
