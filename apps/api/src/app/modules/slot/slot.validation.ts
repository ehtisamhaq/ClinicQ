import { z } from "zod";
import { SlotStatus } from "../../../generated/prisma/client";

export const slotQuerySchema = {
  query: z.object({
    doctorId: z.string().optional(),
    clinicId: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    status: z.nativeEnum(SlotStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
  }),
};

export const slotIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Slot ID is required"),
  }),
};

export const generateSlotsSchema = {
  body: z.object({
    doctorId: z.string().min(1, "Doctor ID is required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
    slotMinutes: z.number().int().positive().optional(),
  }),
};

export type SlotQuery = z.infer<typeof slotQuerySchema.query>;
export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema.body>;
