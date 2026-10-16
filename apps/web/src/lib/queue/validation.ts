import { z } from "zod";

export const updateQueueStatusSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  status: z.enum([
    "CHECKED_IN",
    "IN_CONSULTATION",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  reason: z.string().max(300).optional(),
});

export const walkInBookingSchema = z.object({
  patientEmail: z.string().email("Valid patient email is required"),
  patientPhone: z.string().optional(),
  preferredLanguage: z.enum(["en", "bn"]).default("en"),
  doctorId: z.string().min(1, "Doctor selection is required"),
  slotId: z.string().min(1, "Slot selection is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  autoCheckIn: z.boolean().default(true),
});

export type UpdateQueueStatusInput = z.infer<typeof updateQueueStatusSchema>;
export type WalkInBookingInput = z.infer<typeof walkInBookingSchema>;
