import type { AppointmentStatusType } from "@/lib/appointments/types";

export interface TrackingDetails {
  status: AppointmentStatusType;
  queuePosition: number | null;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  doctor: {
    specialty: string;
    consultationFee: number | string;
    email: string;
  };
  slot: {
    startsAt: string;
    endsAt: string;
  };
  patientInitials: string;
  checkedInAt: string | null;
  consultStartedAt: string | null;
  completedAt: string | null;
}
