import type { AppointmentItem, AppointmentStatusType, UrgencyLevelType } from "@/lib/appointments/types";
import type { DoctorQueueDetails } from "@/lib/queue/types";

export interface DoctorProfileItem {
  id: string;
  name?: string;
  specialty: string;
  subSpecialty?: string | null;
  consultationFee: number;
  avgConsultMinutes: number;
  gender: string;
  languages: string[];
  roomNumber?: string | null;
  user: {
    id: string;
    email: string;
    preferredLanguage?: string;
  };
}

export interface DoctorTodayData {
  doctor: DoctorProfileItem;
  queueDetails: DoctorQueueDetails | null;
  appointments: AppointmentItem[];
}
