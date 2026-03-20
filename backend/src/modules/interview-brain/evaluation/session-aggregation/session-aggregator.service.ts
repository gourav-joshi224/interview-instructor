import { Injectable } from '@nestjs/common';
import {
  calculateConceptPerformance,
  getRepeatedMissingConcepts,
  getStrongestAreas,
  getWeakestAreas,
} from './concept-performance.util';
import { getReadinessBand } from './readiness-band.util';
import { calculateOverallScore, countAttemptStatuses } from './score-aggregation.util';
import { generateStudyPlan } from './study-plan.util';
import { SessionAggregationInput, SessionReport } from './session-aggregator.types';

@Injectable()
export class SessionAggregatorService {
  public aggregate(input: SessionAggregationInput): SessionReport {
    const overallScore = calculateOverallScore(input.questionResults, input.difficulty);
    const conceptPerformance = calculateConceptPerformance(input.questionResults);
    const strongestAreas = getStrongestAreas(conceptPerformance);
    const weakestAreas = getWeakestAreas(conceptPerformance);
    const repeatedMissingConcepts = getRepeatedMissingConcepts(input.questionResults);
    const readinessBand = getReadinessBand(overallScore);
    const studyPlan = generateStudyPlan(weakestAreas, repeatedMissingConcepts);
    const { nonAttemptCount, weakAttemptCount, evaluatedCount } = countAttemptStatuses(input.questionResults);

    return {
      sessionId: input.sessionId,
      topic: input.topic,
      difficulty: input.difficulty,
      experience: input.experience,
      totalQuestions: input.totalQuestions,
      overallScore,
      readinessBand,
      nonAttemptCount,
      weakAttemptCount,
      evaluatedCount,
      conceptPerformance,
      strongestAreas,
      weakestAreas,
      repeatedMissingConcepts,
      studyPlan,
      summary: this.buildSummary(strongestAreas, weakestAreas, repeatedMissingConcepts, readinessBand),
    };
  }

  private buildSummary(
    strongestAreas: SessionReport['strongestAreas'],
    weakestAreas: SessionReport['weakestAreas'],
    repeatedMissingConcepts: string[],
    readinessBand: SessionReport['readinessBand'],
  ): string {
    const leadStrength = strongestAreas[0]?.concept ?? 'core backend concepts';
    const leadWeakness = repeatedMissingConcepts[0] ?? weakestAreas[0]?.concept ?? 'foundational details';
    const readinessPhrase = this.getReadinessPhrase(readinessBand);

    return `You showed ${readinessPhrase} in ${leadStrength}, but repeated misses in ${leadWeakness} lowered your readiness for backend interviews.`;
  }

  private getReadinessPhrase(readinessBand: SessionReport['readinessBand']): string {
    switch (readinessBand) {
      case 'not_ready':
        return 'limited understanding';
      case 'fundamentals_needed':
        return 'partial understanding';
      case 'improving':
        return 'decent understanding';
      case 'interview_capable':
        return 'solid understanding';
      case 'strong_ready':
        return 'strong understanding';
      default:
        return 'decent understanding';
    }
  }
}
