/**
 * ClinicQ Centralized Cache Tags and Lifetimes Registry
 *
 * In accordance with Next.js 16 Cache Components rules:
 * - Shared, non-personal catalog data (doctors, specialties, schedules, clinic knowledge)
 *   is cached using "use cache" with explicit cacheTag(...) and cacheLife(...).
 * - User-specific or role-protected data (appointments, queue, admin metrics)
 *   is NEVER cached with "use cache" and is fetched with { cache: "no-store" } inside Suspense.
 */

export const CACHE_TAGS = {
  // Shared catalog tags
  DOCTORS: "doctors",
  SPECIALTIES: "specialties",
  CLINIC_INFO: "clinic-info",
  KNOWLEDGE: "knowledge",

  // Parametric tags
  doctor: (doctorId: string) => `doctor-${doctorId}`,
  doctorSlots: (doctorId: string, date: string) => `slots-${doctorId}-${date}`,
  doctorSchedule: (doctorId: string) => `schedule-${doctorId}`,
} as const;

/**
 * Standard CacheLife duration profiles (in seconds)
 */
export const CACHE_LIFETIMES = {
  // Static clinic metadata (hours)
  CLINIC_INFO: 60 * 60 * 24, // 24 hours
  KNOWLEDGE: 60 * 60 * 12,   // 12 hours
  DOCTORS: 60 * 60 * 4,      // 4 hours

  // Dynamic slot availability (revalidated on mutation, short max age)
  SLOTS: 60 * 5,              // 5 minutes fallback
} as const;
