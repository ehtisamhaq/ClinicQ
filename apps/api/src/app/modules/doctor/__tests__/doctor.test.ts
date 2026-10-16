import { describe, it, expect } from "bun:test";
import {
  doctorQuerySchema,
  createDoctorSchema,
  updateDoctorSchema,
  updateScheduleSchema,
} from "../doctor.validation";

describe("Doctor Module Validation Tests", () => {
  describe("Doctor Query Schema", () => {
    it("should accept empty query with defaults", () => {
      const result = doctorQuerySchema.query.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should parse query filters correctly", () => {
      const result = doctorQuerySchema.query.safeParse({
        specialty: "Cardiology",
        gender: "female",
        language: "en",
        minFee: "500",
        maxFee: "1500",
        page: "2",
        limit: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.specialty).toBe("Cardiology");
        expect(result.data.minFee).toBe(500);
        expect(result.data.maxFee).toBe(1500);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should reject negative or zero page", () => {
      expect(doctorQuerySchema.query.safeParse({ page: 0 }).success).toBe(false);
      expect(doctorQuerySchema.query.safeParse({ page: -1 }).success).toBe(false);
    });
  });

  describe("Create Doctor Schema", () => {
    it("should validate valid doctor profile payload", () => {
      const valid = {
        userId: "user-123",
        specialty: "Pediatrics",
        bio: "Experienced pediatrician",
        gender: "female",
        languages: ["English", "Bengali"],
        consultationFee: 1000,
        avgConsultMinutes: 15,
      };
      const result = createDoctorSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject non-positive consultation fee", () => {
      const invalid = {
        userId: "user-123",
        specialty: "Pediatrics",
        consultationFee: -50,
      };
      const result = createDoctorSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Schedule Schema", () => {
    it("should validate weekday and HH:MM time format", () => {
      const valid = {
        schedules: [
          { weekday: 0, startTime: "09:00", endTime: "13:00", slotMinutes: 15 },
          { weekday: 1, startTime: "14:30", endTime: "18:00", slotMinutes: 20 },
        ],
      };
      const result = updateScheduleSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid weekday (> 6 or < 0)", () => {
      const invalid = {
        schedules: [{ weekday: 7, startTime: "09:00", endTime: "13:00" }],
      };
      expect(updateScheduleSchema.body.safeParse(invalid).success).toBe(false);
    });

    it("should reject invalid time formats", () => {
      const invalid = {
        schedules: [{ weekday: 0, startTime: "9am", endTime: "1:00pm" }],
      };
      expect(updateScheduleSchema.body.safeParse(invalid).success).toBe(false);
    });
  });
});
