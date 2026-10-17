import { z } from "zod";
import { DoctorService } from "../../doctor/doctor.service";
import { SlotService } from "../../slot/slot.service";
import { BookingService } from "../../appointment/booking.service";
import { AppointmentService } from "../../appointment/appointment.service";
import { KnowledgeService } from "../../knowledge/knowledge.service";
import {
  BookingChannel,
  Role,
  UrgencyLevel,
} from "../../../../generated/prisma/client";

export const searchDoctorsToolSchema = z.object({
  specialty: z.string().optional(),
  maxFee: z.number().positive().optional(),
  gender: z.string().optional(),
  language: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const getAvailableSlotsToolSchema = z.object({
  doctorId: z.string().min(1),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const bookAppointmentToolSchema = z.object({
  slotId: z.string().min(1),
  reason: z.string().min(3),
  summary: z.string().optional(),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.ROUTINE),
});

export const rescheduleToolSchema = z.object({
  appointmentId: z.string().min(1),
  newSlotId: z.string().min(1),
});

export const cancelToolSchema = z.object({
  appointmentId: z.string().min(1),
});

export const searchClinicInfoToolSchema = z.object({
  query: z.string().min(1),
});

export interface ToolContext {
  userId: string;
  patientId: string;
  clinicId: string;
  role: Role | string;
}

export class AssistantTools {
  static async searchDoctors(args: z.infer<typeof searchDoctorsToolSchema>, ctx: ToolContext) {
    const result = await DoctorService.getDoctors(ctx.clinicId, {
      specialty: args.specialty,
      maxFee: args.maxFee,
      gender: args.gender,
      language: args.language,
      page: 1,
      limit: 10,
    });

    return result.doctors.map((d) => ({
      doctorId: d.id,
      name: d.user.email.split("@")[0] || "Doctor",
      specialty: d.specialty,
      gender: d.gender || "unknown",
      languages: d.languages,
      consultationFee: Number(d.consultationFee),
      avgConsultMinutes: d.avgConsultMinutes,
      bio: d.bio,
    }));
  }

  static async getAvailableSlots(
    args: z.infer<typeof getAvailableSlotsToolSchema>,
    _ctx: ToolContext,
  ) {
    const from = args.from ? new Date(args.from) : undefined;
    const to = args.to ? new Date(args.to) : undefined;
    return SlotService.getAvailableSlots(args.doctorId, from, to);
  }

  static async bookAppointment(
    args: z.infer<typeof bookAppointmentToolSchema>,
    ctx: ToolContext,
    proposalId?: string,
  ) {
    const idempotencyKey = `asst-book-${ctx.patientId}-${args.slotId}-${proposalId || "auto"}`;

    return BookingService.bookAppointment(
      {
        slotId: args.slotId,
        patientId: ctx.patientId,
        reason: args.reason,
        assistantSummary: args.summary,
        urgency: args.urgency,
        bookedVia: BookingChannel.ASSISTANT,
        idempotencyKey,
      },
      {
        id: ctx.userId,
        role: ctx.role,
        clinicId: ctx.clinicId,
        isAssistant: true,
      },
    );
  }

  static async rescheduleAppointment(
    args: z.infer<typeof rescheduleToolSchema>,
    ctx: ToolContext,
  ) {
    return AppointmentService.reschedule(args.appointmentId, args.newSlotId, {
      id: ctx.userId,
      role: ctx.role,
      clinicId: ctx.clinicId,
      isAssistant: true,
    });
  }

  static async cancelAppointment(args: z.infer<typeof cancelToolSchema>, ctx: ToolContext) {
    return AppointmentService.cancel(args.appointmentId, {
      id: ctx.userId,
      role: ctx.role,
      clinicId: ctx.clinicId,
      isAssistant: true,
    });
  }

  static async getMyAppointments(ctx: ToolContext) {
    const result = await AppointmentService.getAppointments(
      {
        id: ctx.userId,
        role: ctx.role,
        clinicId: ctx.clinicId,
        isAssistant: true,
      },
      { page: 1, limit: 10 },
    );
    return result.appointments;
  }

  /**
   * RAG retrieval over clinic knowledge base (spec item 7).
   * Delegates to KnowledgeService.search which queries KnowledgeChunk with keyword
   * fallback (pgvector cosine similarity when embeddings are available).
   * Results cite the source document title so the assistant can attribute answers.
   * Returns an explicit "I do not have that information" message when nothing is found.
   */
  static async searchClinicInfo(
    args: z.infer<typeof searchClinicInfoToolSchema>,
    ctx: ToolContext,
  ) {
    const result = await KnowledgeService.search(args.query, ctx.clinicId, 3);

    if (!result.found || result.results.length === 0) {
      return {
        found: false,
        message: "I do not have specific clinic information regarding that query.",
        results: [] as { title: string; category: string; content: string }[],
      };
    }

    return {
      found: true,
      results: result.results.map((r) => ({
        title: r.sourceTitle,
        category: r.category,
        content: r.content,
      })),
    };
  }
}
