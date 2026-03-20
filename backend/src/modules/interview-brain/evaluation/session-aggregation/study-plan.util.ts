import { ConceptPerformance } from './session-aggregator.types';

const fallbackRecommendation = 'Review one recent answer end to end and rewrite it with clearer technical reasoning.';

const buildWeakAreaRecommendation = (weakestAreas: ConceptPerformance[]): string | null => {
  const weakestArea = weakestAreas[0];
  if (!weakestArea) {
    return null;
  }

  return `Practice ${weakestArea.concept} with 2 focused questions and explain the tradeoffs out loud.`;
};

const buildMissingConceptRecommendation = (repeatedMissingConcepts: string[]): string | null => {
  const primaryMissingConcept = repeatedMissingConcepts[0];
  if (!primaryMissingConcept) {
    return null;
  }

  return `Study ${primaryMissingConcept} first, then answer one question that uses it in a backend scenario.`;
};

const buildCoverageRecommendation = (
  weakestAreas: ConceptPerformance[],
  repeatedMissingConcepts: string[],
): string | null => {
  const secondaryWeakArea = weakestAreas[1]?.concept ?? weakestAreas[0]?.concept;
  const secondaryMissingConcept = repeatedMissingConcepts[1] ?? repeatedMissingConcepts[0];

  if (!secondaryWeakArea && !secondaryMissingConcept) {
    return null;
  }

  if (secondaryWeakArea && secondaryMissingConcept) {
    return `Revisit ${secondaryWeakArea} and connect it explicitly to ${secondaryMissingConcept} in a short mock answer.`;
  }

  if (secondaryWeakArea) {
    return `Strengthen ${secondaryWeakArea} by answering one timed question with concrete implementation details.`;
  }

  return `Turn ${secondaryMissingConcept} into a short note with definitions, examples, and one interview-ready explanation.`;
};

export const generateStudyPlan = (
  weakestAreas: ConceptPerformance[],
  repeatedMissingConcepts: string[],
): string[] => {
  const recommendations = [
    buildWeakAreaRecommendation(weakestAreas),
    buildMissingConceptRecommendation(repeatedMissingConcepts),
    buildCoverageRecommendation(weakestAreas, repeatedMissingConcepts),
  ].filter((recommendation): recommendation is string => Boolean(recommendation));

  while (recommendations.length < 3) {
    recommendations.push(fallbackRecommendation);
  }

  return recommendations.slice(0, 3);
};
