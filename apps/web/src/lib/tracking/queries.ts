import "server-only";
import { apiClient } from "@/lib/api/client";
import type { TrackingDetails } from "./types";

export async function getTrackingDetails(token: string): Promise<TrackingDetails | null> {
  if (!token) return null;

  try {
    const res = await apiClient.get<TrackingDetails>(`/public/track/${token}`, {
      auth: "none",
      next: { revalidate: 0 },
    });
    return res.data || null;
  } catch (err) {
    console.error("Failed to load tracking details:", err);
    return null;
  }
}
