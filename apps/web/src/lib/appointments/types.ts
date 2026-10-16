export type AppointmentStatusType =
  | "BOOKED"
  | "CHECKED_IN"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type UrgencyLevelType = "ROUTINE" | "URGENT" | "EMERGENCY";

export type BookingChannelType = "MANUAL" | "ASSISTANT" | "WALK_IN";

export interface AppointmentSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  doctorId: string;
  doctor: {
    id: string;
    specialty: string;
    consultationFee: number;
    avgConsultMinutes: number;
    user: {
      id: string;
      email: string;
      preferredLanguage?: string;
    };
  };
}

export interface AppointmentItem {
  id: string;
  status: AppointmentStatusType;
  reason: string;
  assistantSummary?: string | null;
  urgency: UrgencyLevelType;
  trackingToken: string;
  bookedVia: BookingChannelType;
  checkedInAt?: string | null;
  consultStartedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  slot: AppointmentSlot;
  patient: {
    id: string;
    user: {
      id: string;
      email: string;
      preferredLanguage?: string;
    };
  };
}

export interface AppointmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetAppointmentsResponse {
  appointments: AppointmentItem[];
  meta: AppointmentPagination;
}
