import { SessionQuestionAggregationResult } from './session-aggregator.types';

const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 1,
  medium: 1.1,
  hard: 1.2,
  epic: 1.35,
};

const roundScore = (value: number): number => Math.round(value);

export const getDifficultyWeight = (difficulty?: string | null): number => {
  if (!difficulty) {
    return DIFFICULTY_WEIGHTS.medium;
  }

  return DIFFICULTY_WEIGHTS[difficulty] ?? DIFFICULTY_WEIGHTS.medium;
};

// Session score is a deterministic weighted average of already-scored questions.
export const calculateOverallScore = (
  questionResults: SessionQuestionAggregationResult[],
  defaultDifficulty?: string,
): number => {
  if (questionResults.length === 0) {
    return 0;
  }

  let weightedScoreTotal = 0;
  let weightTotal = 0;

  for (const result of questionResults) {
    const weight = getDifficultyWeight(result.difficulty ?? defaultDifficulty);
    weightedScoreTotal += result.score * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) {
    return 0;
  }

  return roundScore(weightedScoreTotal / weightTotal);
};

export const countAttemptStatuses = (
  questionResults: SessionQuestionAggregationResult[],
): {
  nonAttemptCount: number;
  weakAttemptCount: number;
  evaluatedCount: number;
} => {
  let nonAttemptCount = 0;
  let weakAttemptCount = 0;
  let evaluatedCount = 0;

  for (const result of questionResults) {
    if (result.attemptGate.status === 'non_attempt') {
      nonAttemptCount += 1;
      continue;
    }

    evaluatedCount += 1;

    if (result.attemptGate.status === 'weak_attempt') {
      weakAttemptCount += 1;
    }
  }

  return {
    nonAttemptCount,
    weakAttemptCount,
    evaluatedCount,
  };
};
