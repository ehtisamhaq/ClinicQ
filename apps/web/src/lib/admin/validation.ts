import { z } from "zod";

export const updateDoctorProfileSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  specialty: z.string().min(2, "Specialty is required"),
  consultationFee: z.coerce.number().positive("Consultation fee must be positive"),
  avgConsultMinutes: z.coerce.number().int().min(5).max(60).default(15),
  bio: z.string().optional(),
});

export const updateDoctorScheduleInputSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  schedules: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
      slotMinutes: z.number().int().positive().default(15),
    })
  ),
});

export const createKnowledgeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
});

export const updateKnowledgeSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  title: z.string().min(3).optional(),
  body: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
});

export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;
export type UpdateDoctorScheduleInput = z.infer<typeof updateDoctorScheduleInputSchema>;
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
