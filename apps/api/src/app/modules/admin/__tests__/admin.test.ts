import { describe, expect, it } from "bun:test";
import {
  metricsQuerySchema,
  auditLogQuerySchema,
} from "../admin.validation";
import { AuditActorType } from "../../../../generated/prisma/client";

describe("Admin Module Validation Tests", () => {
  describe("Metrics Query Schema", () => {
    it("should accept empty query parameters", () => {
      const result = metricsQuerySchema.query.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should parse valid from/to ISO dates and doctorId", () => {
      const valid = {
        from: new Date("2026-01-01T00:00:00Z").toISOString(),
        to: new Date("2026-01-07T23:59:59Z").toISOString(),
        doctorId: "doc_cardiologist_1",
      };
      const result = metricsQuerySchema.query.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doctorId).toBe("doc_cardiologist_1");
      }
    });

    it("should reject invalid datetime format", () => {
      const invalid = {
        from: "2026-01-01", // Not ISO datetime with T/Z
      };
      const result = metricsQuerySchema.query.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Audit Log Query Schema", () => {
    it("should apply default page 1 and limit 50", () => {
      const result = auditLogQuerySchema.query.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should validate actorType enum and pagination", () => {
      const valid = {
        actorType: AuditActorType.ASSISTANT,
        entity: "Appointment",
        action: "BOOK",
        page: "3",
        limit: "25",
      };
      const result = auditLogQuerySchema.query.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actorType).toBe(AuditActorType.ASSISTANT);
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("should cap limit at 100", () => {
      const overLimit = {
        limit: "150",
      };
      const result = auditLogQuerySchema.query.safeParse(overLimit);
      expect(result.success).toBe(false);
    });

    it("should reject negative or zero page", () => {
      const invalid = {
        page: "0",
      };
      const result = auditLogQuerySchema.query.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
