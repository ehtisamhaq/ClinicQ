export type WaitlistStatus = "WAITING" | "OFFERED" | "ACCEPTED" | "EXPIRED" | "CANCELLED";

export interface WaitlistEntryItem {
  id: string;
  patientId: string;
  doctorId: string;
  from: string;
  to: string;
  status: WaitlistStatus;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    specialty: string;
    consultationFee: number;
    user: { email: string };
  };
}
