import type { AppointmentStatusType, UrgencyLevelType } from "@/lib/appointments/types";

export interface DoctorQueueSummary {
  doctorId: string;
  doctorEmail: string;
  specialty: string;
  adaptiveConsultMinutes: number;
  inConsultationCount: number;
  checkedInCount: number;
  bookedCount: number;
  estimatedTotalWaitMinutes: number;
}

export interface CurrentConsultation {
  id: string;
  status: AppointmentStatusType;
  consultStartedAt: string | null;
  slotStartsAt: string;
}

export interface CheckedInQueueItem {
  id: string;
  status: AppointmentStatusType;
  queuePosition: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  patientInitials: string;
  reason: string;
  urgency: UrgencyLevelType;
  checkedInAt: string | null;
  slotStartsAt: string;
  assistantSummary?: string | null;
}

export interface UpcomingBookedItem {
  id: string;
  status: AppointmentStatusType;
  slotStartsAt: string;
  patientInitials: string;
  reason: string;
  urgency: UrgencyLevelType;
  assistantSummary?: string | null;
}

export interface DoctorQueueDetails {
  doctor: {
    id: string;
    specialty: string;
    consultationFee: number;
    baselineMinutes: number;
    email: string;
  };
  adaptiveConsultMinutes: number;
  currentConsultation: CurrentConsultation | null;
  totalWaiting: number;
  checkedInQueue: CheckedInQueueItem[];
  upcomingBooked: UpcomingBookedItem[];
}
