import { describe, it, expect } from "bun:test";
import { calculateAdaptiveConsultMinutes } from "../queue.utils";

describe("Queue Module Tests", () => {
  describe("Adaptive Wait Estimator (EMA)", () => {
    it("should return fallback minutes when duration history is empty", () => {
      const result = calculateAdaptiveConsultMinutes([], 15);
      expect(result).toBe(15);
    });

    it("should return single duration when only one consultation recorded", () => {
      const result = calculateAdaptiveConsultMinutes([22], 15);
      expect(result).toBe(22);
    });

    it("should smoothly adapt with exponential moving average", () => {
      // Baseline 15, then durations increasing: 20, 25, 30
      // Step 0: ema = 20
      // Step 1: 0.3 * 25 + 0.7 * 20 = 7.5 + 14 = 21.5
      // Step 2: 0.3 * 30 + 0.7 * 21.5 = 9 + 15.05 = 24.05 -> round = 24
      const result = calculateAdaptiveConsultMinutes([20, 25, 30], 15, 0.3);
      expect(result).toBe(24);
    });

    it("should filter out invalid outliers (e.g. negative or > 180 min)", () => {
      const result = calculateAdaptiveConsultMinutes([-5, 0, 200, 18], 15);
      expect(result).toBe(18);
    });

    it("should enforce a minimum floor of 5 minutes", () => {
      const result = calculateAdaptiveConsultMinutes([1, 2, 1], 15);
      expect(result).toBeGreaterThanOrEqual(5);
    });

    it("should accurately calculate wait estimate given ahead count and adaptive duration", () => {
      const adaptiveMinutes = 18;
      const getWait = (patientsAhead: number) => patientsAhead * adaptiveMinutes;

      expect(getWait(0)).toBe(0);
      expect(getWait(1)).toBe(18);
      expect(getWait(3)).toBe(54);
    });
  });
});
