import { z } from "zod";
import {
  BookingChannel,
  UrgencyLevel,
} from "../../../generated/prisma/client";

export type RoleType = "user" | "assistant" | "system";

export interface ChatMessage {
  role: RoleType;
  content: string;
}

export interface HardConstraints {
  maxFee?: number;
  gender?: string;
  exactDate?: string; // YYYY-MM-DD
  doctorName?: string;
  doctorId?: string;
}

export interface SoftPreferences {
  timeOfDay?: "morning" | "afternoon" | "evening";
  preferredWeekday?: number; // 0-6
  soonerIsBetter?: boolean;
}

export interface PatientIntake {
  symptoms: string[];
  duration?: string;
  ageGroup?: "child" | "adult" | "senior";
  language?: string;
  specialty?: string;
  urgency: UrgencyLevel;
  hardConstraints: HardConstraints;
  softPreferences: SoftPreferences;
  clarifyQuestionsAsked: number;
}

export interface SlotProposal {
  slotId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  fee: number;
  startsAt: string; // ISO string
  endsAt: string;
  changesRelaxed?: string[] | undefined;
}

export interface TraceStep {
  node: string;
  timestamp: string;
  inputs?: Record<string, unknown>;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
  replanAttempt?: number;
  relaxationsApplied?: string[];
  output?: unknown;
}

export interface SseEvent {
  event: "text" | "tool_status" | "proposal" | "booking_confirmed" | "emergency" | "error" | "done";
  data: Record<string, unknown> | string;
}

export const chatRequestSchema = {
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1),
      }),
    ).min(1, "At least one message is required"),
    locale: z.string().default("en"),
  }),
};

export type ChatRequestBody = z.infer<typeof chatRequestSchema.body>;
