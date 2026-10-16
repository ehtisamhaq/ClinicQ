import { describe, expect, test } from "bun:test";
import type { SlotProposal, AssistantMessage } from "../types";

describe("Assistant Domain Types & Event Structures", () => {
  test("creates valid SlotProposal with optional relaxations", () => {
    const proposal: SlotProposal = {
      slotId: "slot_123",
      doctorId: "doc_456",
      doctorName: "Dr. Sarah Jenkins",
      specialty: "Cardiology",
      fee: 1500,
      startsAt: "2026-10-17T09:00:00.000Z",
      endsAt: "2026-10-17T09:15:00.000Z",
      changesRelaxed: ["Fee relaxed from 1200 to 1500", "Time moved from 08:30 to 09:00"],
    };

    expect(proposal.doctorName).toBe("Dr. Sarah Jenkins");
    expect(proposal.changesRelaxed?.length).toBe(2);
  });

  test("creates emergency message structure correctly", () => {
    const msg: AssistantMessage = {
      id: "msg_emergency",
      role: "assistant",
      content: "Critical emergency detected",
      timestamp: "10:30 AM",
      isEmergency: true,
    };

    expect(msg.isEmergency).toBe(true);
    expect(msg.role).toBe("assistant");
  });

  test("creates booking confirmed structure correctly", () => {
    const msg: AssistantMessage = {
      id: "msg_booked",
      role: "assistant",
      content: "Appointment confirmed",
      timestamp: "10:35 AM",
      bookingConfirmed: {
        appointmentId: "apt_999",
        trackingToken: "trk_abc123",
        startsAt: "2026-10-17T09:00:00.000Z",
      },
    };

    expect(msg.bookingConfirmed?.trackingToken).toBe("trk_abc123");
  });
});
