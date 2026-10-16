export type ChatRole = "user" | "assistant" | "system";

export interface SlotProposal {
  slotId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  fee: number;
  startsAt: string;
  endsAt: string;
  changesRelaxed?: string[] | undefined;
}

export interface BookingConfirmedData {
  appointmentId: string;
  trackingToken: string;
  startsAt: string;
}

export interface AssistantMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  toolStatus?: string | null;
  proposal?: SlotProposal | null;
  bookingConfirmed?: BookingConfirmedData | null;
  isEmergency?: boolean;
  error?: string | null;
}

export interface AssistantChatRequestBody {
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
  locale?: string;
  patientId?: string;
}
