import { apiClient } from "@/lib/api/client";
import { isUnauthorized, isForbidden } from "@/lib/api/types";
import type { AppointmentItem } from "@/lib/appointments/types";
import type { DoctorProfileItem } from "./types";
import type { DoctorQueueDetails } from "@/lib/queue/types";

export * from "./utils";

/**
 * Fetch doctor profile for the current logged-in doctor
 */
export async function getMyDoctorProfile(
  userId: string
): Promise<DoctorProfileItem | null> {
  try {
    const res = await apiClient.get<DoctorProfileItem[]>("/doctors", {
      auth: "session",
      query: { limit: 100 },
    });

    const doctors = res.data || [];
    return doctors.find((d) => d.user?.id === userId) || doctors[0] || null;
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to fetch doctor profile:", err);
    }
    return null;
  }
}

/**
 * Fetch all appointments scheduled for today for this doctor
 */
export async function getDoctorTodayAppointments(
  doctorId?: string,
  date?: string
): Promise<AppointmentItem[]> {
  try {
    let from: string | undefined;
    let to: string | undefined;

    if (date === "ALL") {
      const now = new Date();
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      ).toISOString();
      to = undefined;
    } else {
      const baseDate = date ? new Date(date) : new Date();
      from = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        0,
        0,
        0
      ).toISOString();
      to = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();
    }

    const res = await apiClient.get<AppointmentItem[]>("/appointments", {
      auth: "session",
      query: {
        from,
        to,
        doctorId,
        limit: 100,
      },
    });

    return res.data || [];
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to fetch today appointments:", err);
    }
    return [];
  }
}

/**
 * Fetch today's live queue details for this doctor
 */
export async function getDoctorLiveQueue(
  doctorId: string
): Promise<DoctorQueueDetails | null> {
  try {
    const res = await apiClient.get<DoctorQueueDetails>(`/queue/doctor/${doctorId}`, {
      auth: "session",
    });
    return res.data || null;
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error(`Failed to fetch live queue for doctor ${doctorId}:`, err);
    }
    return null;
  }
}
