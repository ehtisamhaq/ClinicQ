import { describe, expect, test } from "bun:test";
import {
  updateDoctorProfileSchema,
  updateDoctorScheduleInputSchema,
  createKnowledgeSchema,
} from "../validation";

describe("Admin Validation Schemas", () => {
  test("updateDoctorProfileSchema accepts valid doctor update", () => {
    const valid = updateDoctorProfileSchema.safeParse({
      doctorId: "doc_123",
      specialty: "Neurology",
      consultationFee: 2000,
      avgConsultMinutes: 20,
      bio: "Senior Neurologist",
    });
    expect(valid.success).toBe(true);
  });

  test("updateDoctorProfileSchema rejects negative consultation fee", () => {
    const invalid = updateDoctorProfileSchema.safeParse({
      doctorId: "doc_123",
      specialty: "Neurology",
      consultationFee: -500,
    });
    expect(invalid.success).toBe(false);
  });

  test("updateDoctorScheduleInputSchema accepts valid schedule array", () => {
    const valid = updateDoctorScheduleInputSchema.safeParse({
      doctorId: "doc_123",
      schedules: [
        { weekday: 1, startTime: "09:00", endTime: "17:00", slotMinutes: 15 },
        { weekday: 2, startTime: "10:00", endTime: "16:00", slotMinutes: 20 },
      ],
    });
    expect(valid.success).toBe(true);
  });

  test("updateDoctorScheduleInputSchema rejects invalid time format", () => {
    const invalid = updateDoctorScheduleInputSchema.safeParse({
      doctorId: "doc_123",
      schedules: [
        { weekday: 1, startTime: "9am", endTime: "5pm", slotMinutes: 15 },
      ],
    });
    expect(invalid.success).toBe(false);
  });

  test("createKnowledgeSchema accepts valid document data", () => {
    const valid = createKnowledgeSchema.safeParse({
      title: "Clinic Visiting Hours",
      body: "Our clinic is open Sunday through Thursday from 8:00 AM to 9:00 PM.",
      category: "Timings",
    });
    expect(valid.success).toBe(true);
  });

  test("createKnowledgeSchema rejects body shorter than 10 characters", () => {
    const invalid = createKnowledgeSchema.safeParse({
      title: "Clinic Hours",
      body: "Too short",
      category: "Timings",
    });
    expect(invalid.success).toBe(false);
  });
});
