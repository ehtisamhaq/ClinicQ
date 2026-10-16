import { describe, expect, it } from "bun:test";
import {
  ApiError,
  isApiError,
  isUnauthorized,
  isForbidden,
  isNotFound,
  isConflict,
} from "../types";
import { CACHE_TAGS, CACHE_LIFETIMES } from "../cache-tags";

describe("API Types & Error Handling", () => {
  it("should create ApiError with status, message and field issues", () => {
    const error = new ApiError({
      status: 400,
      message: "Validation failed",
      issues: { email: ["Invalid email address"] },
    });

    expect(error.status).toBe(400);
    expect(error.message).toBe("Validation failed");
    expect(error.issues?.email).toEqual(["Invalid email address"]);
    expect(isApiError(error)).toBe(true);
  });

  it("should correctly identify HTTP status helper predicates", () => {
    const unauthorized = new ApiError({ status: 401, message: "Unauthorized" });
    const forbidden = new ApiError({ status: 403, message: "Forbidden" });
    const notFound = new ApiError({ status: 404, message: "Not found" });
    const conflict = new ApiError({ status: 409, message: "Slot conflict" });

    expect(isUnauthorized(unauthorized)).toBe(true);
    expect(isUnauthorized(forbidden)).toBe(false);

    expect(isForbidden(forbidden)).toBe(true);
    expect(isForbidden(unauthorized)).toBe(false);

    expect(isNotFound(notFound)).toBe(true);
    expect(isConflict(conflict)).toBe(true);
  });

  it("should return false for non-ApiError objects", () => {
    expect(isApiError(new Error("Generic"))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError({ status: 400 })).toBe(false);
  });
});

describe("Cache Tags & Lifetimes Registry", () => {
  it("should provide structured cache tags for Next.js 16 cache functions", () => {
    expect(CACHE_TAGS.DOCTORS).toBe("doctors");
    expect(CACHE_TAGS.SPECIALTIES).toBe("specialties");
    expect(CACHE_TAGS.doctor("doc-123")).toBe("doctor-doc-123");
    expect(CACHE_TAGS.doctorSlots("doc-123", "2026-10-20")).toBe("slots-doc-123-2026-10-20");
  });

  it("should have sensible fallback cache lifetimes", () => {
    expect(CACHE_LIFETIMES.CLINIC_INFO).toBeGreaterThan(3600);
    expect(CACHE_LIFETIMES.SLOTS).toBeLessThanOrEqual(300);
  });
});
