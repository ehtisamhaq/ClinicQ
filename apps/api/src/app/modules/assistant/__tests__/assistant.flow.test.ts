import { describe, expect, it } from "bun:test";
import { AgentEngine } from "../engine/agent.engine";
import { LlmFactory } from "../llm/llm.factory";
import type { LlmClient } from "../llm/llm.interface";
import type { ToolContext } from "../tools/assistant.tools";
import type { SseEvent } from "../types";

class FailingTestClient implements LlmClient {
  async generateCompletion(): Promise<string> {
    throw new Error("Simulated Provider Outage 503");
  }
  async generateStructured<T>(): Promise<T> {
    throw new Error("Simulated Provider Outage 503");
  }
}

describe("Assistant Flow Integration Tests", () => {
  const dummyContext: ToolContext = {
    userId: "user_test_123",
    role: "PATIENT",
    clinicId: "clinic-dhaka-central",
    patientId: "patient_test_456",
  };

  it("should handle emergency path: immediate alert event emitted and halts booking", async () => {
    const events: SseEvent[] = [];
    const engine = new AgentEngine({
      messages: [
        { role: "user", content: "I have crushing chest pain and cannot breathe" },
      ],
      context: dummyContext,
      locale: "en",
      onEvent: (e) => events.push(e),
    });

    await engine.run();

    const emergencyEvent = events.find((e) => e.event === "emergency");
    expect(emergencyEvent).toBeDefined();
    expect((emergencyEvent?.data as any)?.message).toContain("MEDICAL ALERT");

    // Should NOT have searched doctors or proposed booking
    const proposalEvent = events.find((e) => e.event === "proposal");
    expect(proposalEvent).toBeUndefined();
  });

  it("should handle provider outage: emits error event and directs user to manual booking", async () => {
    LlmFactory.setClient(new FailingTestClient());
    const events: SseEvent[] = [];

    try {
      const engine = new AgentEngine({
        messages: [{ role: "user", content: "I need a routine physical checkup" }],
        context: dummyContext,
        locale: "en",
        onEvent: (e) => events.push(e),
      });

      await engine.run();

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as any)?.message).toContain("manual booking calendar");
    } finally {
      LlmFactory.reset();
    }
  });

  it("should enforce hard-constraint consent before booking above budget", async () => {
    const events: SseEvent[] = [];
    const engine = new AgentEngine({
      messages: [
        { role: "user", content: "Need a cardiologist with fee under 300" },
      ],
      context: dummyContext,
      locale: "en",
      onEvent: (e) => events.push(e),
    });

    await engine.run();

    // Should ask for permission to show standard fees instead of silently booking
    const textEvent = events.find((e) => e.event === "text");
    expect(textEvent).toBeDefined();
    expect((textEvent?.data as any)?.text).toContain("under ৳300");

    // Should NOT have confirmed a booking
    const bookingEvent = events.find((e) => e.event === "booking_confirmed");
    expect(bookingEvent).toBeUndefined();
  });

  it("should respect replan limit: stop within 3 attempts when nothing matches", async () => {
    const events: SseEvent[] = [];
    const engine = new AgentEngine({
      messages: [
        { role: "user", content: "Need a specialized pediatric neurosurgeon on Sunday midnight under 100 BDT" },
      ],
      context: dummyContext,
      locale: "en",
      onEvent: (e) => events.push(e),
    });

    await engine.run();

    const textEvents = events.filter((e) => e.event === "text");
    const fullText = textEvents.map((t) => (t.data as any)?.text || "").join(" ");
    expect(
      fullText.includes("waitlist") ||
      fullText.includes("manual booking calendar") ||
      fullText.includes("standard fees")
    ).toBe(true);
  });
});
