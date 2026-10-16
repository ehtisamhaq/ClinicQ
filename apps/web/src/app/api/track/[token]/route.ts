import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/types";
import type { TrackingDetails } from "@/lib/tracking/types";

export async function GET(
  _request: Request,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await props.params;
    if (!token) {
      return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 });
    }

    const res = await apiClient.get<TrackingDetails>(`/public/track/${token}`, {
      auth: "none",
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to fetch tracking details";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
