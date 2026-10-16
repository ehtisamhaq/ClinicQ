import { z } from "zod";
import { AuditActorType } from "../../../generated/prisma/client";

export const metricsQuerySchema = {
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    doctorId: z.string().optional(),
  }),
};

export const auditLogQuerySchema = {
  query: z.object({
    actorType: z.nativeEnum(AuditActorType).optional(),
    actorId: z.string().optional(),
    entity: z.string().optional(),
    action: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
};

export type MetricsQuery = z.infer<typeof metricsQuerySchema.query>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema.query>;
