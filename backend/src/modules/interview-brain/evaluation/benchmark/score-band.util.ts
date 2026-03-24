import { BenchmarkScoreBand } from './benchmark.types';

const BAND_RANGES: Readonly<Record<BenchmarkScoreBand, { min: number; max: number }>> = {
  // Inclusive boundaries mirror the benchmark contract and protect edge scores.
  non_attempt: { min: 0, max: 10 },
  weak: { min: 11, max: 35 },
  partial: { min: 36, max: 60 },
  solid: { min: 61, max: 80 },
  strong: { min: 81, max: 100 },
};

export function scoreToBand(score: number): BenchmarkScoreBand {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Benchmark score must be a finite number between 0 and 100');
  }

  if (score <= BAND_RANGES.non_attempt.max) {
    return 'non_attempt';
  }

  if (score <= BAND_RANGES.weak.max) {
    return 'weak';
  }

  if (score <= BAND_RANGES.partial.max) {
    return 'partial';
  }

  if (score <= BAND_RANGES.solid.max) {
    return 'solid';
  }

  return 'strong';
}

export function bandToScoreRange(band: BenchmarkScoreBand): { min: number; max: number } {
  return BAND_RANGES[band];
}
