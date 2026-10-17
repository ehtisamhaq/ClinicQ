import { apiClient } from "@/lib/api/client";
import { isUnauthorized, isForbidden } from "@/lib/api/types";
import type { AppointmentItem, AppointmentPagination } from "./types";

export * from "./utils";

export interface AppointmentQueryParams {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch personal appointments for the logged-in patient.
 * Dynamic (no-store): Personal data must never be cached across users.
 */
export async function getMyAppointments(
  params?: AppointmentQueryParams
): Promise<{ appointments: AppointmentItem[]; meta: AppointmentPagination }> {
  try {
    const res = await apiClient.get<AppointmentItem[]>("/appointments", {
      auth: "session",
      query: {
        status: params?.status,
        from: params?.from,
        to: params?.to,
        page: params?.page || 1,
        limit: params?.limit || 50,
      },
    });

    return {
      appointments: res.data || [],
      meta: (res.meta as unknown as AppointmentPagination) || {
        page: params?.page || 1,
        limit: params?.limit || 50,
        total: (res.data || []).length,
        totalPages: 1,
      },
    };
  } catch (error) {
    if (!isUnauthorized(error) && !isForbidden(error)) {
      console.error("Failed to load appointments:", error);
    }
    return {
      appointments: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    };
  }
}
