import { z } from "zod";
import {
  AppointmentStatus,
  BookingChannel,
  UrgencyLevel,
} from "../../../generated/prisma/client";

export const bookAppointmentSchema = {
  body: z.object({
    slotId: z.string().min(1, "slotId is required"),
    patientId: z.string().optional(),
    reason: z.string().min(3, "Reason must be at least 3 characters"),
    assistantSummary: z.string().optional(),
    urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.ROUTINE),
    bookedVia: z.nativeEnum(BookingChannel).default(BookingChannel.MANUAL),
  }),
};

export const rescheduleAppointmentSchema = {
  params: z.object({
    id: z.string().min(1, "Appointment ID is required"),
  }),
  body: z.object({
    newSlotId: z.string().min(1, "newSlotId is required"),
  }),
};

export const updateAppointmentStatusSchema = {
  params: z.object({
    id: z.string().min(1, "Appointment ID is required"),
  }),
  body: z.object({
    status: z.nativeEnum(AppointmentStatus),
    reason: z.string().optional(),
  }),
};

export const appointmentQuerySchema = {
  query: z.object({
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};

export const appointmentIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Appointment ID is required"),
  }),
};

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema.body>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema.body>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema.body>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema.query>;
