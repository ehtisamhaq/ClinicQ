import { describe, it, expect } from "bun:test";
import { slotQuerySchema, generateSlotsSchema } from "../slot.validation";
import { SlotStatus } from "../../../../generated/prisma/client";

describe("Slot Module Validation Tests", () => {
  describe("Slot Query Schema", () => {
    it("should accept valid slot filter query", () => {
      const valid = {
        doctorId: "doc-123",
        status: SlotStatus.AVAILABLE,
        from: "2026-10-17T00:00:00.000Z",
        to: "2026-10-24T23:59:59.000Z",
        page: "1",
        limit: "50",
      };
      const result = slotQuerySchema.query.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doctorId).toBe("doc-123");
        expect(result.data.status).toBe(SlotStatus.AVAILABLE);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject invalid status", () => {
      const invalid = {
        status: "INVALID_STATUS",
      };
      const result = slotQuerySchema.query.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Generate Slots Schema", () => {
    it("should accept valid generate payload with YYYY-MM-DD", () => {
      const valid = {
        doctorId: "doc-123",
        startDate: "2026-10-18",
        endDate: "2026-10-25",
        slotMinutes: 15,
      };
      const result = generateSlotsSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const invalid = {
        doctorId: "doc-123",
        startDate: "18-10-2026",
        endDate: "25-10-2026",
      };
      const result = generateSlotsSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
