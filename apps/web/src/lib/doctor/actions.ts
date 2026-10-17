"use server";

import { getDoctorTodayAppointments, getDoctorLiveQueue } from "./queries";
import type { AppointmentItem } from "@/lib/appointments/types";
import type { DoctorQueueDetails } from "@/lib/queue/types";

export async function refreshDoctorDashboardAction(
  doctorId: string,
  date?: string
): Promise<{
  appointments: AppointmentItem[];
  queueDetails: DoctorQueueDetails | null;
}> {
  try {
    const [appointments, queueDetails] = await Promise.all([
      getDoctorTodayAppointments(doctorId, date),
      getDoctorLiveQueue(doctorId),
    ]);
    return { appointments, queueDetails };
  } catch {
    return { appointments: [], queueDetails: null };
  }
}
