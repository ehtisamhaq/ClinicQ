import { describe, it, expect } from "bun:test";
import argon2 from "argon2";
import {
  signAccessToken,
  signRefreshToken,
  signSocketToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySocketToken,
} from "../../../utils/jwt";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../auth.validation";

describe("Auth Module Unit Tests", () => {
  describe("Password Hashing (Argon2)", () => {
    it("should hash and verify passwords correctly", async () => {
      const password = "SuperSecretPassword123!";
      const hash = await argon2.hash(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith("$argon2id$")).toBe(true);

      const isValid = await argon2.verify(hash, password);
      expect(isValid).toBe(true);

      const isInvalid = await argon2.verify(hash, "WrongPassword");
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT Utilities", () => {
    const mockUser = {
      sub: "user-test-123",
      role: "PATIENT",
      clinicId: "clinic-test-456",
    };

    it("should sign and verify access token", () => {
      const token = signAccessToken(mockUser);
      expect(typeof token).toBe("string");

      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe(mockUser.sub);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.clinicId).toBe(mockUser.clinicId);
      expect(payload.type).toBe("access");
    });

    it("should sign and verify refresh token", () => {
      const token = signRefreshToken(mockUser);
      expect(typeof token).toBe("string");

      const payload = verifyRefreshToken(token);
      expect(payload.sub).toBe(mockUser.sub);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.clinicId).toBe(mockUser.clinicId);
      expect(payload.type).toBe("refresh");
    });

    it("should sign and verify socket token", () => {
      const token = signSocketToken(mockUser);
      expect(typeof token).toBe("string");

      const payload = verifySocketToken(token);
      expect(payload.sub).toBe(mockUser.sub);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.clinicId).toBe(mockUser.clinicId);
      expect(payload.type).toBe("socket");
    });

    it("should fail to verify tampered token", () => {
      const token = signAccessToken(mockUser);
      const tampered = token.slice(0, -5) + "abcde";
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe("Auth Validation Schemas", () => {
    it("should accept valid registration payload", () => {
      const valid = {
        email: "patient@example.com",
        password: "securepassword123",
        phone: "+8801700000000",
        preferredLanguage: "bn",
      };

      const result = registerSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid registration email and short password", () => {
      const invalid = {
        email: "not-an-email",
        password: "short",
      };

      const result = registerSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should accept valid login payload", () => {
      const valid = {
        email: "doctor@clinicq.local",
        password: "Password123!",
      };

      const result = loginSchema.body.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty login password", () => {
      const invalid = {
        email: "doctor@clinicq.local",
        password: "",
      };

      const result = loginSchema.body.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate refresh token schema", () => {
      expect(refreshTokenSchema.body.safeParse({ refreshToken: "token123" }).success).toBe(true);
      expect(refreshTokenSchema.body.safeParse({ refreshToken: "" }).success).toBe(false);
      expect(refreshTokenSchema.body.safeParse({}).success).toBe(false);
    });
  });
});
