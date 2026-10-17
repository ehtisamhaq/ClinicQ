import { apiClient } from "@/lib/api/client";
import { isUnauthorized, isForbidden } from "@/lib/api/types";
import type { DoctorQueueSummary, DoctorQueueDetails } from "./types";

/**
 * Fetch clinic queue overview for all doctors (Reception & Admin)
 * Dynamic (no-store): Live operational state with session authorization
 */
export async function getClinicQueueOverview(): Promise<DoctorQueueSummary[]> {
  try {
    const res = await apiClient.get<DoctorQueueSummary[]>("/queue/clinic", {
      auth: "session",
    });
    return res.data || [];
  } catch (error) {
    if (!isUnauthorized(error) && !isForbidden(error)) {
      console.error("Failed to fetch clinic queue overview:", error);
    }
    return [];
  }
}

/**
 * Fetch detailed live queue for a specific doctor
 */
export async function getDoctorQueueDetails(
  doctorId: string
): Promise<DoctorQueueDetails | null> {
  try {
    const res = await apiClient.get<DoctorQueueDetails>(`/queue/doctor/${doctorId}`, {
      auth: "session",
    });
    return res.data || null;
  } catch (error) {
    if (!isUnauthorized(error) && !isForbidden(error)) {
      console.error(`Failed to fetch queue for doctor ${doctorId}:`, error);
    }
    return null;
  }
}
