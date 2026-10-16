import { z } from "zod";
import { WaitlistStatus } from "../../../generated/prisma/client";

export const joinWaitlistSchema = {
  body: z.object({
    doctorId: z.string().min(1, "Doctor ID is required"),
    from: z.string().datetime("from must be a valid ISO datetime"),
    to: z.string().datetime("to must be a valid ISO datetime"),
    patientId: z.string().optional(),
  }),
};

export const waitlistIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Waitlist ID is required"),
  }),
};

export const waitlistQuerySchema = {
  query: z.object({
    doctorId: z.string().optional(),
    patientId: z.string().optional(),
    status: z.nativeEnum(WaitlistStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
};

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema.body>;
export type WaitlistQuery = z.infer<typeof waitlistQuerySchema.query>;
