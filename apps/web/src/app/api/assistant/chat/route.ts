import { NextResponse } from "next/server";
import { getAccessToken, refreshServerSession } from "@/lib/auth/session";
import { getApiBaseUrl } from "@/lib/config";

export async function POST(req: Request) {
  let token = await getAccessToken();

  if (!token) {
    token = await refreshServerSession();
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Please sign in to chat with the booking assistant." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const apiUrl = getApiBaseUrl();

    const backendRes = await fetch(`${apiUrl}/assistant/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errJson = await backendRes.json().catch(() => null);
      return NextResponse.json(
        { success: false, message: errJson?.message || `Assistant backend error: ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    if (!backendRes.body) {
      return NextResponse.json(
        { success: false, message: "No response stream from assistant" },
        { status: 500 }
      );
    }

    // Stream SSE directly back to browser
    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Assistant BFF proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal error connecting to assistant",
      },
      { status: 500 }
    );
  }
}
