import { describe, expect, it } from "bun:test";
import {
  joinWaitlistSchema,
  waitlistQuerySchema,
  waitlistIdParamSchema,
} from "../waitlist.validation";
import { WaitlistStatus } from "../../../../generated/prisma/client";

describe("Waitlist Module Validation Tests", () => {
  describe("Join Waitlist Schema", () => {
    it("should accept valid join waitlist payload", () => {
      const valid = {
        doctorId: "doc_123",
        from: new Date().toISOString(),
        to: new Date(Date.now() + 86400000).toISOString(),
        patientId: "patient_abc",
      };

      const result = joinWaitlistSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doctorId).toBe("doc_123");
      }
    });

    it("should reject invalid ISO date string in from/to", () => {
      const invalid = {
        doctorId: "doc_123",
        from: "not-a-date",
        to: new Date().toISOString(),
      };

      const result = joinWaitlistSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty doctorId", () => {
      const invalid = {
        doctorId: "",
        from: new Date().toISOString(),
        to: new Date().toISOString(),
      };

      const result = joinWaitlistSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Waitlist Query Schema", () => {
    it("should set default page 1 and limit 20", () => {
      const result = waitlistQuerySchema.query.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept valid status enum filter", () => {
      const result = waitlistQuerySchema.query.safeParse({
        status: WaitlistStatus.WAITING,
        page: "2",
        limit: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(WaitlistStatus.WAITING);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should reject invalid status", () => {
      const result = waitlistQuerySchema.query.safeParse({
        status: "NON_EXISTENT_STATUS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Waitlist ID Param Schema", () => {
    it("should validate non-empty waitlist id", () => {
      const result = waitlistIdParamSchema.params.safeParse({ id: "wl_123" });
      expect(result.success).toBe(true);
    });

    it("should reject empty waitlist id", () => {
      const result = waitlistIdParamSchema.params.safeParse({ id: "" });
      expect(result.success).toBe(false);
    });
  });
});
