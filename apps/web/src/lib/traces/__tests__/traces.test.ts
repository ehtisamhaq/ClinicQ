import { describe, expect, test } from "bun:test";
import type { AssistantTrace, TraceStep } from "../types";

describe("Traces Domain Tests", () => {
  test("AssistantTrace correctly holds step timeline and outcome", () => {
    const steps: TraceStep[] = [
      {
        node: "safetyCheck",
        timestamp: "2026-10-17T09:00:00.000Z",
        output: { isEmergency: false },
      },
      {
        node: "extractConstraints",
        timestamp: "2026-10-17T09:00:01.000Z",
        output: { specialty: "Cardiology", maxFee: 1500 },
      },
      {
        node: "searchSlots",
        timestamp: "2026-10-17T09:00:02.000Z",
        toolCalls: [
          {
            name: "searchDoctors",
            args: { specialty: "Cardiology" },
            result: [{ id: "doc_1", name: "Dr. Smith" }],
          },
        ],
      },
      {
        node: "executeBooking",
        timestamp: "2026-10-17T09:00:05.000Z",
        output: { appointmentId: "apt_123", status: "BOOKED" },
      },
    ];

    const trace: AssistantTrace = {
      id: "trace_1",
      clinicId: "clinic_1",
      patientId: "pat_1",
      requestId: "req_xyz_123",
      steps,
      outcome: "BOOKED",
      createdAt: "2026-10-17T09:00:00.000Z",
    };

    expect(trace.outcome).toBe("BOOKED");
    expect(trace.steps.length).toBe(4);
    expect(trace.steps[0].node).toBe("safetyCheck");
    expect(trace.steps[2].toolCalls?.[0].name).toBe("searchDoctors");
  });

  test("AssistantTrace models replans and constraint relaxation", () => {
    const step: TraceStep = {
      node: "replan",
      timestamp: "2026-10-17T09:01:00.000Z",
      replanAttempt: 1,
      relaxationsApplied: ["Fee cap raised from 1000 to 1500"],
      output: { replanSuccess: true },
    };

    expect(step.replanAttempt).toBe(1);
    expect(step.relaxationsApplied).toContain("Fee cap raised from 1000 to 1500");
  });
});
