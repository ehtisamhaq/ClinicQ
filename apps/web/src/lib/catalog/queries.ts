import { cacheLife, cacheTag } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export interface DoctorCatalogItem {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string | null;
  consultationFee: number;
  gender: string;
  languages: string[];
  experienceYears: number;
  bio?: string | null;
  avatarUrl?: string | null;
  qualifications: string[];
  roomNumber?: string | null;
  schedules?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
  }>;
}

export interface SlotItem {
  id: string;
  doctorId: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

/**
 * Fetch all available specialties in the clinic (cached for hours)
 */
export async function getSpecialties(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.SPECIALTIES);
  cacheLife("hours");

  try {
    const res = await apiClient.get<string[]>("/doctors/specialties", {
      auth: "none",
    });
    return res.data || [];
  } catch {
    return [
      "General Medicine",
      "Cardiology",
      "Pediatrics",
      "Dermatology",
      "Neurology",
      "Orthopedics",
      "Gynecology",
    ];
  }
}

/**
 * Fetch doctors catalog with optional filters (cached for hours)
 */
export async function getDoctors(filters?: {
  specialty?: string;
  gender?: string;
  maxFee?: number;
  language?: string;
  search?: string;
}): Promise<DoctorCatalogItem[]> {
  "use cache";
  cacheTag(CACHE_TAGS.DOCTORS);
  cacheLife("hours");

  try {
    const res = await apiClient.get<DoctorCatalogItem[]>("/doctors", {
      auth: "none",
      query: {
        specialty: filters?.specialty,
        gender: filters?.gender,
        maxFee: filters?.maxFee,
        language: filters?.language,
        search: filters?.search,
        limit: 50,
      },
    });
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch single doctor profile and schedules
 */
export async function getDoctorById(id: string): Promise<DoctorCatalogItem | null> {
  "use cache";
  cacheTag(CACHE_TAGS.doctor(id));
  cacheLife("hours");

  try {
    const res = await apiClient.get<DoctorCatalogItem>(`/doctors/${id}`, {
      auth: "none",
    });
    return res.data || null;
  } catch {
    return null;
  }
}

/**
 * Fetch available slots for a doctor on a specific date (cached for 5 minutes, invalidated on booking)
 */
export async function getDoctorSlots(
  doctorId: string,
  dateString: string
): Promise<SlotItem[]> {
  "use cache";
  cacheTag(CACHE_TAGS.doctorSlots(doctorId, dateString));
  cacheLife("minutes");

  try {
    const startOfDay = new Date(`${dateString}T00:00:00.000Z`).toISOString();
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`).toISOString();

    const res = await apiClient.get<SlotItem[]>(`/slots/doctor/${doctorId}`, {
      auth: "none",
      query: {
        from: startOfDay,
        to: endOfDay,
      },
    });

    return (res.data || []).filter((s) => s.status === "AVAILABLE");
  } catch {
    return [];
  }
}
