import type { ZodSchema } from "zod";
import type { LlmClient } from "./llm.interface";
import { UrgencyLevel } from "../../../../generated/prisma/client";

export class MockLlmClient implements LlmClient {
  async generateCompletion(prompt: string, _systemPrompt?: string): Promise<string> {
    const lower = prompt.toLowerCase();

    if (
      lower.includes("chest pain") ||
      lower.includes("breathing") ||
      lower.includes("stroke") ||
      lower.includes("বুক ব্যথা")
    ) {
      return "⚠️ Medical Alert: Your symptoms require urgent emergency care. Please visit the nearest emergency room or call an ambulance immediately.";
    }

    if (lower.includes("pediatric") || lower.includes("child") || lower.includes("বাচ্চা")) {
      return "I understand your child needs medical attention. I am checking our pediatric specialists and available slots.";
    }

    if (lower.includes("heart") || lower.includes("cardi")) {
      return "I see you need cardiac consultation. Checking our Cardiology department and available appointment slots.";
    }

    return "Thank you for describing your symptoms. Let me find a suitable doctor and available appointment slots for you.";
  }

  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    _systemPrompt?: string,
  ): Promise<T> {
    const lower = prompt.toLowerCase();

    // Check emergency
    const isEmergency =
      lower.includes("chest pain") ||
      lower.includes("difficulty breathing") ||
      lower.includes("shortness of breath") ||
      lower.includes("severe bleeding") ||
      lower.includes("stroke") ||
      lower.includes("unconscious") ||
      lower.includes("slurred speech") ||
      lower.includes("facial droop") ||
      lower.includes("drooping") ||
      lower.includes("cannot lift") ||
      lower.includes("paralysis") ||
      lower.includes("convulsion") ||
      lower.includes("seizure") ||
      lower.includes("বুক ব্যথা") ||
      lower.includes("শ্বাসকষ্ট");

    // Check specialty
    let specialty = "General Medicine";
    let urgency: UrgencyLevel = UrgencyLevel.ROUTINE;

    if (
      lower.includes("heart") ||
      lower.includes("cardi") ||
      lower.includes("palpitation") ||
      lower.includes("blood pressure")
    ) {
      specialty = "Cardiology";
      urgency = UrgencyLevel.SOON;
    } else if (
      lower.includes("child") ||
      lower.includes("baby") ||
      lower.includes("infant") ||
      lower.includes("kid") ||
      lower.includes("vaccin") ||
      lower.includes("bacha") ||
      lower.includes("baccha") ||
      lower.includes("shishu") ||
      lower.includes("বাচ্চা")
    ) {
      specialty = "Pediatrics";
      urgency = UrgencyLevel.ROUTINE;
    } else if (
      lower.includes("skin") ||
      lower.includes("rash") ||
      lower.includes("itch") ||
      lower.includes("ত্বক")
    ) {
      specialty = "Dermatology";
      urgency = UrgencyLevel.ROUTINE;
    } else if (
      lower.includes("bone") ||
      lower.includes("joint") ||
      lower.includes("fracture") ||
      lower.includes("knee") ||
      lower.includes("হাড়")
    ) {
      specialty = "Orthopedics";
      urgency = UrgencyLevel.ROUTINE;
    } else if (lower.includes("neuro")) {
      specialty = "Pediatric Neurology";
      urgency = UrgencyLevel.SOON;
    } else if (
      lower.includes("stomach") ||
      lower.includes("belly") ||
      lower.includes("gastric")
    ) {
      specialty = "Gastroenterology";
      urgency = UrgencyLevel.ROUTINE;
    }

    // Extract constraints
    let maxFee: number | undefined;
    const feeMatch = lower.match(/(?:under|below|less than|max|budget)\s*(?:of)?\s*(\d+)/);
    if (feeMatch && feeMatch[1]) {
      maxFee = parseInt(feeMatch[1], 10);
    }

    let gender: string | undefined;
    if (
      lower.includes("female doctor") ||
      lower.includes("lady doctor") ||
      lower.includes("woman doctor") ||
      lower.includes("মহিলা ডাক্তার")
    ) {
      gender = "female";
    } else if (lower.includes("male doctor")) {
      gender = "male";
    }

    let timeOfDay: "morning" | "afternoon" | "evening" | undefined;
    if (lower.includes("morning") || lower.includes("সকাল")) {
      timeOfDay = "morning";
    } else if (lower.includes("afternoon") || lower.includes("বিকাল")) {
      timeOfDay = "afternoon";
    } else if (lower.includes("evening") || lower.includes("সন্ধ্যা")) {
      timeOfDay = "evening";
    }

    // Is this a confirmation?
    const isConfirmed =
      /^(yes|confirm|book|sure|agree|ok|okay|1|first|please book|হ্যাঁ|হা)/i.test(
        prompt.trim(),
      ) || lower.includes("book the first") || lower.includes("book option 1");

    const mockData: Record<string, unknown> = {
      isEmergency,
      emergencyGuidance: isEmergency
        ? "Please visit the nearest emergency room or dial emergency medical services immediately."
        : undefined,
      symptoms: [prompt.slice(0, 100)],
      specialty,
      urgency,
      isConfirmed,
      hardConstraints: {
        maxFee,
        gender,
      },
      softPreferences: {
        timeOfDay,
      },
      clarifyQuestion: null,
    };

    if (!schema) {
      return mockData as T;
    }

    const parsed = schema.safeParse(mockData);
    if (parsed.success) {
      return parsed.data;
    }

    // Fallback: parse raw mockData with schema parse
    return schema.parse(mockData);
  }
}
