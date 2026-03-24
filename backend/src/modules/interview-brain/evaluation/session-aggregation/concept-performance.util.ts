import { ConceptPerformance, SessionQuestionAggregationResult } from './session-aggregator.types';

const roundScore = (value: number): number => Math.round(value);

const getGroupingKey = (result: SessionQuestionAggregationResult): string => {
  const concept = result.concept?.trim();
  if (concept) {
    return concept;
  }

  const subtopic = result.subtopic?.trim();
  if (subtopic) {
    return subtopic;
  }

  return 'general';
};

export const calculateConceptPerformance = (
  questionResults: SessionQuestionAggregationResult[],
): ConceptPerformance[] => {
  const grouped = new Map<
    string,
    {
      totalScore: number;
      attempts: number;
      weakCount: number;
      nonAttemptCount: number;
    }
  >();

  for (const result of questionResults) {
    const key = getGroupingKey(result);
    const existing = grouped.get(key) ?? {
      totalScore: 0,
      attempts: 0,
      weakCount: 0,
      nonAttemptCount: 0,
    };

    existing.totalScore += result.score;
    existing.attempts += 1;

    if (result.attemptGate.status === 'weak_attempt') {
      existing.weakCount += 1;
    }

    if (result.attemptGate.status === 'non_attempt') {
      existing.nonAttemptCount += 1;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .map(([concept, aggregate]): ConceptPerformance => ({
      concept,
      averageScore: aggregate.attempts === 0 ? 0 : roundScore(aggregate.totalScore / aggregate.attempts),
      attempts: aggregate.attempts,
      weakCount: aggregate.weakCount,
      nonAttemptCount: aggregate.nonAttemptCount,
    }))
    .sort((left, right) => {
      if (right.averageScore !== left.averageScore) {
        return right.averageScore - left.averageScore;
      }

      if (left.nonAttemptCount !== right.nonAttemptCount) {
        return left.nonAttemptCount - right.nonAttemptCount;
      }

      if (left.weakCount !== right.weakCount) {
        return left.weakCount - right.weakCount;
      }

      return left.concept.localeCompare(right.concept);
    });
};

export const getStrongestAreas = (conceptPerformance: ConceptPerformance[]): ConceptPerformance[] => {
  return conceptPerformance.slice(0, 3);
};

export const getWeakestAreas = (conceptPerformance: ConceptPerformance[]): ConceptPerformance[] => {
  return [...conceptPerformance]
    .sort((left, right) => {
      if (left.averageScore !== right.averageScore) {
        return left.averageScore - right.averageScore;
      }

      if (left.nonAttemptCount !== right.nonAttemptCount) {
        return right.nonAttemptCount - left.nonAttemptCount;
      }

      if (left.weakCount !== right.weakCount) {
        return right.weakCount - left.weakCount;
      }

      return left.concept.localeCompare(right.concept);
    })
    .slice(0, 3);
};

export const getRepeatedMissingConcepts = (
  questionResults: SessionQuestionAggregationResult[],
): string[] => {
  const frequencies = new Map<string, number>();

  for (const result of questionResults) {
    for (const missingConcept of result.feedback.missingConcepts) {
      const normalizedConcept = missingConcept.trim();
      if (!normalizedConcept) {
        continue;
      }

      frequencies.set(normalizedConcept, (frequencies.get(normalizedConcept) ?? 0) + 1);
    }
  }

  return Array.from(frequencies.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .map(([concept]) => concept);
};
