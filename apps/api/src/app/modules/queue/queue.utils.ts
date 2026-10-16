/**
 * Computes the Exponential Moving Average (EMA) of consultation durations.
 *
 * @param durations Chronological array of consultation durations in minutes (oldest to newest)
 * @param fallbackMinutes The doctor's baseline avgConsultMinutes (default: 15)
 * @param alpha Smoothing factor (default: 0.3)
 * @returns Adaptive average consultation duration in minutes
 */
export function calculateAdaptiveConsultMinutes(
  durations: number[],
  fallbackMinutes = 15,
  alpha = 0.3,
): number {
  // Filter out nonsensical durations (<= 0 or > 180 min)
  const valid = durations.filter((d) => d > 0 && d <= 180);

  if (valid.length === 0) {
    return fallbackMinutes;
  }

  // Seed EMA with the first duration
  let ema = valid[0]!;

  for (let i = 1; i < valid.length; i++) {
    ema = alpha * valid[i]! + (1 - alpha) * ema;
  }

  // Round to nearest integer (or at least 5 minutes)
  return Math.max(5, Math.round(ema));
}
