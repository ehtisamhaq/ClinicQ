import { describe, expect, it } from "bun:test";
import { loginInputSchema, registerInputSchema } from "../validation";

describe("Auth Validation Schemas", () => {
  it("should accept valid login input", () => {
    const valid = loginInputSchema.safeParse({
      email: "doctor@clinicq.com",
      password: "Password123!",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject login with empty credentials", () => {
    const result = loginInputSchema.safeParse({
      email: "",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject login with invalid email", () => {
    const result = loginInputSchema.safeParse({
      email: "not-an-email",
      password: "Secret123!",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid registration input", () => {
    const valid = registerInputSchema.safeParse({
      email: "patient@clinicq.com",
      password: "Password123!",
      phone: "+8801700000000",
      preferredLanguage: "bn",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject registration with password shorter than 8 characters", () => {
    const result = registerInputSchema.safeParse({
      email: "valid@clinicq.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
