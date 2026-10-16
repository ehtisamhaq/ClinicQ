import type { AppointmentItem } from "./types";

/**
 * Check if an appointment is scheduled for today (calendar day comparison)
 */
export function isAppointmentToday(startsAt: string): boolean {
  const appointmentDate = new Date(startsAt);
  const today = new Date();

  return (
    appointmentDate.getFullYear() === today.getFullYear() &&
    appointmentDate.getMonth() === today.getMonth() &&
    appointmentDate.getDate() === today.getDate()
  );
}

/**
 * Check if an appointment is upcoming or in-progress
 */
export function isUpcomingAppointment(appointment: AppointmentItem): boolean {
  if (
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED" ||
    appointment.status === "NO_SHOW"
  ) {
    return false;
  }
  return true;
}
