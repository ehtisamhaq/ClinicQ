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
  clinicId?: string;
  startsAt?: string;
  endsAt?: string;
  startTime?: string;
  endTime?: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

export function formatDoctorCatalogItem(raw: any): DoctorCatalogItem {
  if (!raw) return {} as DoctorCatalogItem;

  const email = raw.user?.email || raw.email || "";
  const handle = email ? email.split("@")[0] : "";
  const nameParts = handle
    ? handle
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    : ["Doctor"];
  let fallbackName = nameParts.join(" ");
  if (fallbackName.toLowerCase().startsWith("dr ")) {
    fallbackName = "Dr. " + fallbackName.slice(3).trim();
  } else if (!fallbackName.toLowerCase().startsWith("dr.")) {
    fallbackName = `Dr. ${fallbackName}`;
  }

  const name = raw.name || fallbackName;
  const specialty = raw.specialty || "General Medicine";
  const consultationFee = Number(raw.consultationFee) || 0;
  const gender = raw.gender || "Not specified";
  const languages = Array.isArray(raw.languages) && raw.languages.length > 0 ? raw.languages : ["English", "Bengali"];
  const qualifications = Array.isArray(raw.qualifications) && raw.qualifications.length > 0 ? raw.qualifications : ["MBBS", "FCPS"];
  const experienceYears = typeof raw.experienceYears === "number" ? raw.experienceYears : 10;
  const bio = raw.bio || `Specialist in ${specialty}.`;
  const roomNumber = raw.roomNumber || null;

  return {
    ...raw,
    id: raw.id,
    name,
    specialty,
    subSpecialty: raw.subSpecialty || null,
    consultationFee,
    gender,
    languages,
    experienceYears,
    bio,
    avatarUrl: raw.avatarUrl || null,
    qualifications,
    roomNumber,
    schedules: Array.isArray(raw.schedules) ? raw.schedules : [],
  };
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
    const res = await apiClient.get<any[]>("/doctors", {
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
    return (res.data || []).map(formatDoctorCatalogItem);
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
    const res = await apiClient.get<any>(`/doctors/${id}`, {
      auth: "none",
    });
    return res.data ? formatDoctorCatalogItem(res.data) : null;
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
