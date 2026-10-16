import { describe, it, expect } from "bun:test";
import {
  chatRequestSchema,
  type ChatMessage,
} from "../types";
import { MockLlmClient } from "../llm/mock.client";
import {
  searchDoctorsToolSchema,
  bookAppointmentToolSchema,
  rescheduleToolSchema,
} from "../tools/assistant.tools";
import { UrgencyLevel } from "../../../../generated/prisma/client";

describe("Assistant Module Unit Tests", () => {
  const mockLlm = new MockLlmClient();

  describe("Safety & Emergency Detection", () => {
    it("should detect emergency keywords and return emergency alert text", async () => {
      const response = await mockLlm.generateCompletion(
        "I have severe chest pain and cannot breathe properly",
      );
      expect(response.includes("Medical Alert") || response.includes("emergency")).toBe(true);
    });

    it("should detect Bengali emergency symptoms", async () => {
      const response = await mockLlm.generateCompletion("আমার তীব্র বুক ব্যথা হচ্ছে");
      expect(response.includes("Medical Alert") || response.includes("emergency")).toBe(true);
    });

    it("should flag isEmergency = true in structured output for emergency queries", async () => {
      const result: any = await mockLlm.generateStructured(
        "Patient has acute chest pain and shortness of breath",
        undefined as any,
      );
      expect(result.isEmergency).toBe(true);
      expect(result.emergencyGuidance).toBeDefined();
    });

    it("should not flag non-emergency symptoms like mild rash or routine checkup", async () => {
      const result: any = await mockLlm.generateStructured(
        "I need a routine annual wellness checkup",
        undefined as any,
      );
      expect(result.isEmergency).toBe(false);
    });
  });

  describe("Symptom Routing & Constraint Extraction", () => {
    it("should route heart and palpitation symptoms to Cardiology", async () => {
      const result: any = await mockLlm.generateStructured(
        "I have high blood pressure and irregular heart palpitations",
        undefined as any,
      );
      expect(result.specialty).toBe("Cardiology");
      expect(result.urgency).toBe(UrgencyLevel.SOON);
    });

    it("should route infant and child fever symptoms to Pediatrics", async () => {
      const result: any = await mockLlm.generateStructured(
        "My 2-year old child has a mild fever and needs vaccination",
        undefined as any,
      );
      expect(result.specialty).toBe("Pediatrics");
    });

    it("should correctly extract hard fee cap constraints", async () => {
      const result: any = await mockLlm.generateStructured(
        "Looking for a general doctor under 900 BDT fee",
        undefined as any,
      );
      expect(result.hardConstraints?.maxFee).toBe(900);
    });

    it("should correctly extract doctor gender preferences", async () => {
      const result: any = await mockLlm.generateStructured(
        "I prefer to see a female doctor tomorrow morning",
        undefined as any,
      );
      expect(result.hardConstraints?.gender).toBe("female");
      expect(result.softPreferences?.timeOfDay).toBe("morning");
    });

    it("should recognize booking confirmation keywords", async () => {
      const confirmResult: any = await mockLlm.generateStructured("Yes, book it please", undefined as any);
      expect(confirmResult.isConfirmed).toBe(true);

      const nonConfirmResult: any = await mockLlm.generateStructured(
        "Can you tell me more about the fee?",
        undefined as any,
      );
      expect(nonConfirmResult.isConfirmed).toBe(false);
    });
  });

  describe("Tool Argument Validation Schemas", () => {
    it("should validate searchDoctorsToolSchema", () => {
      const valid = {
        specialty: "Cardiology",
        maxFee: 1200,
        gender: "female",
      };
      expect(searchDoctorsToolSchema.safeParse(valid).success).toBe(true);
    });

    it("should validate bookAppointmentToolSchema requiring valid slotId and reason >= 3 chars", () => {
      expect(
        bookAppointmentToolSchema.safeParse({
          slotId: "slot-abc",
          reason: "Mild fever checkup",
        }).success,
      ).toBe(true);

      expect(
        bookAppointmentToolSchema.safeParse({
          slotId: "slot-abc",
          reason: "no",
        }).success,
      ).toBe(false);
    });

    it("should validate rescheduleToolSchema", () => {
      expect(
        rescheduleToolSchema.safeParse({
          appointmentId: "appt-1",
          newSlotId: "slot-2",
        }).success,
      ).toBe(true);
    });
  });

  describe("Chat Request Body Validation", () => {
    it("should accept valid messages array", () => {
      const body = {
        messages: [
          { role: "user" as const, content: "Hello, I want to book a doctor" },
        ],
        locale: "en",
      };
      expect(chatRequestSchema.body.safeParse(body).success).toBe(true);
    });

    it("should reject empty messages array", () => {
      const invalid = {
        messages: [],
      };
      expect(chatRequestSchema.body.safeParse(invalid).success).toBe(false);
    });
  });
});
