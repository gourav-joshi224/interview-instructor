const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Deterministic confidence grows with both performance and sample size.
 * Attempts are capped at 3 for the confidence multiplier to avoid over-weighting volume.
 */
export const calculateConfidence = (rollingAverage: number, attempts: number): number => {
  const confidence = (rollingAverage / 100) * Math.min(attempts / 3, 1);
  return Number(clamp(confidence, 0, 1).toFixed(4));
};
