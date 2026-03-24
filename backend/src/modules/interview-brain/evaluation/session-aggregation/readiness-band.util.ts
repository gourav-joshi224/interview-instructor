import { ReadinessBand } from './session-aggregator.types';

// Readiness bands convert the 0-100 aggregate score into deterministic interview readiness labels.
export const getReadinessBand = (overallScore: number): ReadinessBand => {
  if (overallScore <= 25) {
    return 'not_ready';
  }

  if (overallScore <= 45) {
    return 'fundamentals_needed';
  }

  if (overallScore <= 65) {
    return 'improving';
  }

  if (overallScore <= 80) {
    return 'interview_capable';
  }

  return 'strong_ready';
};
