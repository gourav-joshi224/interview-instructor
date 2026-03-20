import { Injectable } from '@nestjs/common';
import {
  EvaluationContext,
  EvidenceExtractionResult,
  ProfileScoreBreakdown,
  ScoreDimension,
  ScoreProfile,
  ScoreProfileId,
  ScoreBreakdownDimension,
} from './evaluation.types';

// D4: weights extracted to named constant for configurability
// To adjust scoring: edit SCORE_PROFILE_WEIGHTS, not service logic
export const SCORE_PROFILE_WEIGHTS = {
  fundamentals: {
    relevance: 0.2,
    correctness: 0.3,
    completeness: 0.2,
    reasoning: 0.2,
    communication: 0.1,
  },
  debugging: {
    relevance: 0.15,
    correctness: 0.2,
    completeness: 0.2,
    reasoning: 0.3,
    communication: 0.15,
  },
  scenario: {
    relevance: 0.2,
    correctness: 0.2,
    completeness: 0.2,
    reasoning: 0.25,
    communication: 0.15,
  },
  system_design: {
    relevance: 0.15,
    correctness: 0.2,
    completeness: 0.25,
    reasoning: 0.25,
    communication: 0.15,
  },
} as const;

const SCORE_PROFILES: Record<ScoreProfileId, ScoreProfile> = {
  fundamentals: {
    id: 'fundamentals',
    label: 'Fundamentals',
    weights: SCORE_PROFILE_WEIGHTS.fundamentals,
    redFlagPenalty: 8,
  },
  debugging: {
    id: 'debugging',
    label: 'Debugging',
    weights: SCORE_PROFILE_WEIGHTS.debugging,
    redFlagPenalty: 10,
  },
  scenario: {
    id: 'scenario',
    label: 'Scenario',
    weights: SCORE_PROFILE_WEIGHTS.scenario,
    redFlagPenalty: 9,
  },
  system_design: {
    id: 'system_design',
    label: 'System Design',
    weights: SCORE_PROFILE_WEIGHTS.system_design,
    redFlagPenalty: 10,
  },
};

const SCORE_DIMENSIONS: ScoreDimension[] = ['relevance', 'correctness', 'completeness', 'reasoning', 'communication'];

@Injectable()
export class ScoreEngineService {
  public getProfile(profileId: ScoreProfileId): ScoreProfile {
    const profile = SCORE_PROFILES[profileId];
    if (!profile) {
      throw new Error(`INVALID_PROFILE_MAPPING: unknown profile ${profileId}`);
    }
    return profile;
  }

  public score(context: EvaluationContext, evidence: EvidenceExtractionResult): {
    score: number;
    scoreBreakdown: ProfileScoreBreakdown;
  } {
    const profile = this.getProfile(context.rubric.profile);
    const weights = {
      ...profile.weights,
      ...context.rubric.scoringWeights,
    };

    const mustHaveMatched = evidence.mustHaveMatches.filter((match) => match.matched).length;
    const niceToHaveMatched = evidence.niceToHaveMatches.filter((match) => match.matched).length;
    const strategyMatched = evidence.strategyMatches.filter((match) => match.matched).length;
    const redFlagsMatched = evidence.redFlagMatches.filter((match) => match.matched).length;

    const rawScores: Record<ScoreDimension, number> = {
      relevance: this.computeRatioScore(mustHaveMatched + strategyMatched, context.rubric.mustHave.length + context.rubric.validStrategies.length),
      correctness: this.computeRatioScore(mustHaveMatched, context.rubric.mustHave.length),
      completeness: this.computeRatioScore(
        mustHaveMatched + niceToHaveMatched,
        context.rubric.mustHave.length + context.rubric.niceToHave.length,
      ),
      reasoning: this.computeReasoningScore(evidence, strategyMatched, context.rubric.validStrategies.length),
      communication: this.computeCommunicationScore(evidence),
    };

    const dimensions = SCORE_DIMENSIONS.reduce<Record<ScoreDimension, ScoreBreakdownDimension>>((accumulator, dimension) => {
      const raw = rawScores[dimension];
      const weight = weights[dimension];
      accumulator[dimension] = {
        raw,
        weight,
        weighted: Number((raw * weight).toFixed(2)),
      };
      return accumulator;
    }, {} as Record<ScoreDimension, ScoreBreakdownDimension>);

    const weightedTotal = SCORE_DIMENSIONS.reduce((sum, dimension) => sum + dimensions[dimension].weighted, 0);
    const penalty = redFlagsMatched * profile.redFlagPenalty;
    const capsApplied: string[] = [];

    // Attempt gate always runs before rubric scoring so hard non-attempts never leak points.
    if (context.attemptGate.status === 'non_attempt') {
      capsApplied.push('non_attempt_zero');
      return {
        score: 0,
        scoreBreakdown: {
          profile: profile.id,
          dimensions,
          rawTotal: this.roundScore(weightedTotal),
          weightedTotal: 0,
          matchedMustHaveCount: mustHaveMatched,
          matchedNiceToHaveCount: niceToHaveMatched,
          matchedStrategyCount: strategyMatched,
          matchedRedFlagCount: redFlagsMatched,
          penaltiesApplied: penalty,
          capsApplied,
        },
      };
    }

    let finalScore = this.roundScore(Math.max(0, weightedTotal - penalty));

    // Without any must-have evidence the answer cannot show enough rubric coverage for a strong score.
    if (mustHaveMatched === 0) {
      finalScore = Math.min(finalScore, 20);
      capsApplied.push('no_must_have_cap_20');
    }

    // Weak attempts remain scorable, but Step 3 defines a deterministic ceiling for this question only.
    if (context.attemptGate.status === 'weak_attempt' && context.attemptGate.scoreCap !== null) {
      finalScore = Math.min(finalScore, context.attemptGate.scoreCap);
      capsApplied.push(`attempt_gate_cap_${context.attemptGate.scoreCap}`);
    }

    return {
      score: finalScore,
      scoreBreakdown: {
        profile: profile.id,
        dimensions,
        rawTotal: this.roundScore(weightedTotal),
        weightedTotal: finalScore,
        matchedMustHaveCount: mustHaveMatched,
        matchedNiceToHaveCount: niceToHaveMatched,
        matchedStrategyCount: strategyMatched,
        matchedRedFlagCount: redFlagsMatched,
        penaltiesApplied: penalty,
        capsApplied,
      },
    };
  }

  private computeRatioScore(matched: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return this.roundScore((matched / total) * 100);
  }

  private computeReasoningScore(
    evidence: EvidenceExtractionResult,
    strategyMatched: number,
    totalStrategies: number,
  ): number {
    const strategyScore = this.computeRatioScore(strategyMatched, totalStrategies || 1);
    const reasoningSignalBonus = Math.min(evidence.reasoningSignals.length * 8, 24);
    return Math.min(100, this.roundScore(strategyScore * 0.75 + reasoningSignalBonus));
  }

  private computeCommunicationScore(evidence: EvidenceExtractionResult): number {
    const structureBonus = Math.min(evidence.communicationSignals.length * 12, 36);
    const lengthBonus = evidence.answerTokenCount >= 40 ? 30 : evidence.answerTokenCount >= 20 ? 18 : evidence.answerTokenCount >= 10 ? 10 : 0;
    const reasoningBonus = Math.min(evidence.reasoningSignals.length * 6, 18);
    return Math.min(100, this.roundScore(20 + structureBonus + lengthBonus + reasoningBonus));
  }

  private roundScore(score: number): number {
    return Math.round(score);
  }
}
