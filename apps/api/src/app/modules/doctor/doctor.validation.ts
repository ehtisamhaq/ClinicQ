import { z } from "zod";

export const doctorQuerySchema = {
  query: z.object({
    specialty: z.string().optional(),
    gender: z.string().optional(),
    language: z.string().optional(),
    minFee: z.coerce.number().optional(),
    maxFee: z.coerce.number().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};

export const doctorIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
};

export const createDoctorSchema = {
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    specialty: z.string().min(1, "Specialty is required"),
    bio: z.string().optional(),
    gender: z.string().optional(),
    languages: z.array(z.string()).default([]),
    consultationFee: z.coerce.number().positive("Fee must be positive"),
    avgConsultMinutes: z.coerce.number().int().positive().default(15),
  }),
};

export const updateDoctorSchema = {
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
  body: z.object({
    specialty: z.string().min(1).optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    languages: z.array(z.string()).optional(),
    consultationFee: z.coerce.number().positive().optional(),
    avgConsultMinutes: z.coerce.number().int().positive().optional(),
  }),
};

export const scheduleItemSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  slotMinutes: z.number().int().positive().default(15),
});

export const updateScheduleSchema = {
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
  body: z.object({
    schedules: z.array(scheduleItemSchema),
  }),
};

export type DoctorQuery = z.infer<typeof doctorQuerySchema.query>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema.body>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema.body>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema.body>;
