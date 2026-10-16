import type { AppointmentItem, UrgencyLevelType } from "@/lib/appointments/types";

/**
 * Calculates consultation duration in minutes from ISO timestamps
 */
export function calculateConsultationDurationMinutes(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined
): number {
  if (!startedAt || !completedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (end < start) return 0;
  return Math.max(1, Math.round((end - start) / (60 * 1000)));
}

/**
 * Formats elapsed time string for ongoing consultations
 */
export function formatElapsedMinutes(startedAt: string | null | undefined): string {
  if (!startedAt) return "0m";
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.floor((now - start) / (60 * 1000)));
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  return `${hours}h ${remainingMins}m`;
}

const URGENCY_PRIORITY: Record<UrgencyLevelType, number> = {
  EMERGENCY: 1,
  URGENT: 2,
  ROUTINE: 3,
};

/**
 * Sorts appointments by clinical urgency priority first, then slot time
 */
export function sortAppointmentsByUrgency(
  appointments: AppointmentItem[]
): AppointmentItem[] {
  return [...appointments].sort((a, b) => {
    const priorityA = URGENCY_PRIORITY[a.urgency] ?? 3;
    const priorityB = URGENCY_PRIORITY[b.urgency] ?? 3;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime();
  });
}
