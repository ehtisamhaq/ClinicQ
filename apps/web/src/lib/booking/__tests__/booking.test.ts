import { describe, expect, it } from "bun:test";
import { bookManualInputSchema } from "../validation";

describe("Booking Validation Schema", () => {
  it("should accept valid booking input", () => {
    const valid = bookManualInputSchema.safeParse({
      slotId: "slot-abc-123",
      reason: "High fever and persistent cough",
      doctorId: "doc-456",
      dateString: "2026-10-20",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject booking with empty slotId", () => {
    const res = bookManualInputSchema.safeParse({
      slotId: "",
      reason: "High fever and persistent cough",
    });
    expect(res.success).toBe(false);
  });

  it("should reject booking with reason shorter than 3 characters", () => {
    const res = bookManualInputSchema.safeParse({
      slotId: "slot-123",
      reason: "Hi",
    });
    expect(res.success).toBe(false);
  });
});
