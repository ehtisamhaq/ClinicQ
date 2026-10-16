import crypto from "node:crypto";
import prisma from "../../../../lib/prisma";
import { UrgencyLevel } from "../../../../generated/prisma/client";
import { LlmFactory } from "../llm/llm.factory";
import { SYSTEM_ASSISTANT_PROMPT } from "../prompts/system.prompt";
import {
  AssistantTools,
  type ToolContext,
} from "../tools/assistant.tools";
import type {
  ChatMessage,
  HardConstraints,
  SlotProposal,
  SoftPreferences,
  SseEvent,
  TraceStep,
} from "../types";

export interface AgentEngineInput {
  messages: ChatMessage[];
  context: ToolContext;
  locale?: string | undefined;
  onEvent: (event: SseEvent) => void;
}

export class AgentEngine {
  private messages: ChatMessage[];
  private context: ToolContext;
  private locale: string;
  private onEvent: (event: SseEvent) => void;
  private steps: TraceStep[] = [];
  private requestId = crypto.randomUUID();

  constructor(input: AgentEngineInput) {
    this.messages = input.messages;
    this.context = input.context;
    this.locale = input.locale || "en";
    this.onEvent = input.onEvent;
  }

  private addStep(step: TraceStep) {
    this.steps.push(step);
  }

  /**
   * Main entrypoint: runs the 10-step agent pipeline and persists the AssistantTrace.
   */
  async run(): Promise<void> {
    const lastUserMessage =
      [...this.messages].reverse().find((m) => m.role === "user")?.content || "";

    const llm = LlmFactory.getClient();

    try {
      // ─── Step 1: Safety Check ─────────────────────────────────────────────
      const isEmergency = await this.safetyCheck(lastUserMessage);
      if (isEmergency) {
        const emergencyMsg =
          this.locale === "bn"
            ? "⚠️ জরুরি সতর্কতা: আপনার উপসর্গগুলোর জন্য অবিলম্বে জরুরি চিকিৎসার প্রয়োজন। অনুগ্রহ করে নিকটস্থ জরুরি বিভাগে যোগাযোগ করুন।"
            : "⚠️ MEDICAL ALERT: Your symptoms indicate an urgent medical situation. Please go immediately to the nearest emergency room or call emergency services (999).";

        this.onEvent({ event: "emergency", data: { message: emergencyMsg } });
        this.onEvent({ event: "text", data: { text: emergencyMsg } });
        await this.persistTrace("EMERGENCY_REDIRECTED");
        this.onEvent({ event: "done", data: {} });
        return;
      }

      // ─── Side Flow: General Clinic Info (RAG) Check ───────────────────────
      const isInfoQuery = /\b(fees?|costs?|charges?|timings?|hours?|opening|location|address|where|policy)\b|ভাড়া|খরচ|সময়|কোথায়/i.test(
        lastUserMessage,
      );
      if (
        isInfoQuery &&
        !/\b(book|appointment|schedule|doctor|specialist|consult|visit|see|need|want)\b|ডাক্তার/i.test(lastUserMessage)
      ) {
        this.addStep({ node: "answerInfo", timestamp: new Date().toISOString() });
        const info = await AssistantTools.searchClinicInfo({ query: lastUserMessage }, this.context);
        let infoText = "";
        if (info.found && info.results.length > 0) {
          infoText = info.results.map((r) => `📌 **${r.title}**\n${r.content}`).join("\n\n");
        } else {
          infoText = "I do not have specific clinic information regarding that query. Would you like to consult one of our specialists?";
        }
        this.onEvent({ event: "text", data: { text: infoText } });
        await this.persistTrace("INFO_ANSWERED");
        this.onEvent({ event: "done", data: {} });
        return;
      }

      // ─── Step 2: Understand (Extract Intake & Constraints) ─────────────────
      this.onEvent({
        event: "tool_status",
        data: { message: "Analyzing your symptoms and preferences..." },
      });

      const structuredIntake: any = await llm.generateStructured(
        `Analyze conversation history:\n${this.messages.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
        // Schema definition for understanding
        undefined as any,
        SYSTEM_ASSISTANT_PROMPT,
      );

      const hardConstraints: HardConstraints = structuredIntake?.hardConstraints || {};
      const softPreferences: SoftPreferences = structuredIntake?.softPreferences || {};
      const specialty: string = structuredIntake?.specialty || "General Medicine";
      const urgency: UrgencyLevel = structuredIntake?.urgency || UrgencyLevel.ROUTINE;

      this.addStep({
        node: "understand",
        timestamp: new Date().toISOString(),
        inputs: { specialty, urgency, hardConstraints, softPreferences },
      });

      // ─── Step 8 & 9 Check: Is this a confirmation to book? ────────────────
      const isConfirmation =
        structuredIntake.isConfirmed ||
        /^(yes|confirm|book|agree|sure|1|first|হ্যাঁ|হা)/i.test(lastUserMessage.trim());

      // Look for a proposed slot in previous assistant messages
      const previousProposal = this.findRecentProposal();

      if (isConfirmation && previousProposal) {
        // Step 9: ACT (Book Appointment)
        this.onEvent({
          event: "tool_status",
          data: { message: "Finalizing your appointment with guaranteed slot allocation..." },
        });

        try {
          const bookingResult = await AssistantTools.bookAppointment(
            {
              slotId: previousProposal.slotId,
              reason: lastUserMessage.length > 3 ? lastUserMessage : "Consultation requested via AI Assistant",
              summary: `AI Assistant booking for ${specialty} (Urgency: ${urgency})`,
              urgency,
            },
            this.context,
            previousProposal.slotId,
          );

          this.addStep({
            node: "act",
            timestamp: new Date().toISOString(),
            toolCalls: [
              {
                name: "bookAppointment",
                args: { slotId: previousProposal.slotId, specialty },
                result: { appointmentId: bookingResult.id },
              },
            ],
          });

          // Step 10: FINISH
          const confDate = new Date(bookingResult.slot.startsAt).toLocaleString();
          const confirmText =
            this.locale === "bn"
              ? `✅ আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে!\n- ডাক্তার: ${bookingResult.slot.doctor.user.email.split("@")[0]}\n- বিভাগ: ${bookingResult.slot.doctor.specialty}\n- সময়: ${confDate}\n- ফি: ৳${bookingResult.slot.doctor.consultationFee}\nঅনুগ্রহ করে নির্ধারিত সময়ের ১০ মিনিট পূর্বে উপস্থিত থাকুন।`
              : `✅ Appointment Confirmed!\n- Doctor: ${bookingResult.slot.doctor.user.email.split("@")[0]}\n- Specialty: ${bookingResult.slot.doctor.specialty}\n- Date & Time: ${confDate}\n- Fee: ৳${bookingResult.slot.doctor.consultationFee}\nPlease arrive 10 minutes prior to your scheduled time.`;

          this.onEvent({
            event: "booking_confirmed",
            data: {
              appointmentId: bookingResult.id,
              trackingToken: bookingResult.trackingToken,
              startsAt: bookingResult.slot.startsAt,
            },
          });
          this.onEvent({ event: "text", data: { text: confirmText } });
          await this.persistTrace("BOOKED_SUCCESSFULLY");
          this.onEvent({ event: "done", data: {} });
          return;
        } catch (err: any) {
          const failMsg = `Booking failed: ${err.message || "Slot was just taken"}. Let me find another option for you.`;
          this.onEvent({ event: "text", data: { text: failMsg } });
        }
      }

      // ─── Step 4 & 5: Route & Search with Constraints ──────────────────────
      this.onEvent({
        event: "tool_status",
        data: { message: `Searching specialists for ${specialty}...` },
      });

      let matchingDoctors = await AssistantTools.searchDoctors(
        {
          specialty,
          maxFee: hardConstraints.maxFee,
          gender: hardConstraints.gender,
        },
        this.context,
      );

      this.addStep({
        node: "search",
        timestamp: new Date().toISOString(),
        toolCalls: [
          {
            name: "searchDoctors",
            args: { specialty, ...hardConstraints },
            result: { count: matchingDoctors.length },
          },
        ],
      });

      // ─── Step 6: Replanning when 0 matches ─────────────────────────────────
      let replanAttempts = 0;
      const relaxationsApplied: string[] = [];

      while (matchingDoctors.length === 0 && replanAttempts < 3) {
        replanAttempts++;

        // Relax soft preferences sequentially
        if (softPreferences.timeOfDay) {
          relaxationsApplied.push("widened time of day");
          delete softPreferences.timeOfDay;
        } else if (hardConstraints.maxFee) {
          // Hard constraint hit: MUST ask patient first!
          const askMsg = `We found no ${specialty} doctors under ৳${hardConstraints.maxFee}. Would you like to see doctors with standard fees (e.g. ৳1,000 - ৳1,200)?`;
          this.onEvent({ event: "text", data: { text: askMsg } });
          this.addStep({
            node: "replan",
            timestamp: new Date().toISOString(),
            replanAttempt: replanAttempts,
            relaxationsApplied: ["asked_hard_constraint_budget"],
          });
          await this.persistTrace("BLOCKED_HARD_CONSTRAINT_CONSENT_REQUESTED");
          this.onEvent({ event: "done", data: {} });
          return;
        } else {
          relaxationsApplied.push("widened to all general clinic specialists");
          matchingDoctors = await AssistantTools.searchDoctors({}, this.context);
          break;
        }

        matchingDoctors = await AssistantTools.searchDoctors(
          {
            specialty,
            maxFee: hardConstraints.maxFee,
            gender: hardConstraints.gender,
          },
          this.context,
        );
      }

      if (matchingDoctors.length === 0) {
        const exhaustedMsg =
          "No matching appointments were found after 3 search adjustments. Would you like to join the waitlist or browse our manual booking calendar?";
        this.onEvent({ event: "text", data: { text: exhaustedMsg } });
        await this.persistTrace("REPLAN_EXHAUSTED");
        this.onEvent({ event: "done", data: {} });
        return;
      }

      // Collect available slots for matching doctors
      const proposals: SlotProposal[] = [];

      for (const doc of matchingDoctors.slice(0, 3)) {
        const slots = await AssistantTools.getAvailableSlots({ doctorId: doc.doctorId }, this.context);
        for (const slot of slots.slice(0, 1)) {
          proposals.push({
            slotId: slot.id,
            doctorId: doc.doctorId,
            doctorName: doc.name,
            specialty: doc.specialty,
            fee: doc.consultationFee,
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
            changesRelaxed: relaxationsApplied.length > 0 ? relaxationsApplied : undefined,
          });
        }
      }

      if (proposals.length === 0) {
        const noSlotMsg =
          "Our specialists in this department currently have no free slots today or tomorrow. Would you like to be added to the waitlist?";
        this.onEvent({ event: "text", data: { text: noSlotMsg } });
        await this.persistTrace("NO_SLOTS_AVAILABLE");
        this.onEvent({ event: "done", data: {} });
        return;
      }

      // ─── Step 7: Propose ──────────────────────────────────────────────────
      this.addStep({
        node: "propose",
        timestamp: new Date().toISOString(),
        output: { proposals },
        relaxationsApplied,
      });

      for (const p of proposals) {
        this.onEvent({ event: "proposal", data: p as any });
      }

      let proposalText = `I found a recommended option for your ${specialty} visit:\n`;
      if (relaxationsApplied.length > 0) {
        proposalText += `*(Note: ${relaxationsApplied.join(", ")})*\n`;
      }

      proposals.forEach((p, idx) => {
        const formattedTime = new Date(p.startsAt).toLocaleString();
        proposalText += `\n**Option ${idx + 1}**: Dr. ${p.doctorName} (${p.specialty})\n📅 ${formattedTime}\n💵 Fee: ৳${p.fee}\n`;
      });
      proposalText += `\nPlease reply **"Yes"** or **"Book"** to confirm this slot.`;

      this.onEvent({ event: "text", data: { text: proposalText } });
      await this.persistTrace("PROPOSAL_OFFERED");
      this.onEvent({ event: "done", data: {} });
    } catch (err: any) {
      console.error("Assistant execution error:", err);
      const errorMsg = "The booking assistant encountered an error. You can still book directly using our manual booking calendar.";
      this.onEvent({ event: "error", data: { message: errorMsg } });
      this.onEvent({ event: "done", data: {} });
      await this.persistTrace("ERROR_ENCOUNTERED");
    }
  }

  private async safetyCheck(message: string): Promise<boolean> {
    const lower = message.toLowerCase();
    const emergencyKeywords = [
      "chest pain",
      "heart attack",
      "stroke",
      "cannot breathe",
      "can't breathe",
      "difficulty breathing",
      "shortness of breath",
      "severe bleeding",
      "unconscious",
      "poisoning",
      "slurred speech",
      "facial droop",
      "drooping",
      "cannot lift",
      "paralysis",
      "convulsion",
      "seizure",
      "বুক ব্যথা",
      "শ্বাসকষ্ট",
      "প্রচুর রক্তপাত",
    ];

    const isHit = emergencyKeywords.some((kw) => lower.includes(kw));
    this.addStep({
      node: "safetyCheck",
      timestamp: new Date().toISOString(),
      inputs: { messageSnippet: message.slice(0, 60) },
      output: { isEmergency: isHit },
    });
    return isHit;
  }

  private findRecentProposal(): SlotProposal | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg && msg.role === "assistant" && msg.content.includes("Option 1")) {
        const match = msg.content.match(/Dr\.\s+([^\n]+)/);
        if (match) {
          // If we had a proposal, extract context
          return {
            slotId: "recent-proposed-slot",
            doctorId: "doc-id",
            doctorName: match[1] || "Doctor",
            specialty: "General Medicine",
            fee: 800,
            startsAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          };
        }
      }
    }
    return null;
  }

  private async persistTrace(outcome: string) {
    try {
      await prisma.assistantTrace.create({
        data: {
          clinicId: this.context.clinicId,
          patientId: this.context.patientId,
          requestId: this.requestId,
          steps: this.steps as any,
          outcome,
        },
      });
    } catch (err) {
      console.warn("Could not save assistant trace to database:", err);
    }
  }
}
