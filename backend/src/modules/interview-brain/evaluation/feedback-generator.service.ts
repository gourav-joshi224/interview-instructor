import { Injectable } from '@nestjs/common';
import {
  EvaluationContext,
  EvidenceExtractionResult,
  FeedbackPayload,
  ProfileScoreBreakdown,
} from './evaluation.types';

@Injectable()
export class FeedbackGeneratorService {
  public generate(
    context: EvaluationContext,
    evidence: EvidenceExtractionResult,
    scoreBreakdown: ProfileScoreBreakdown,
  ): FeedbackPayload {
    const strengths = [
      ...evidence.mustHaveMatches.filter((item) => item.matched).map((item) => `Covered must-have: ${item.rubricItem}`),
      ...evidence.strategyMatches
        .filter((item) => item.matched)
        .slice(0, 2)
        .map((item) => `Used valid strategy: ${item.rubricItem}`),
    ].slice(0, 4);

    const missingConcepts = [
      ...evidence.mustHaveMatches.filter((item) => !item.matched).map((item) => item.rubricItem),
      ...evidence.niceToHaveMatches.filter((item) => !item.matched).map((item) => item.rubricItem),
    ].slice(0, 5);

    const explanationParts: string[] = [
      `This answer was scored with the ${context.rubric.profile} rubric profile.`,
      `It matched ${scoreBreakdown.matchedMustHaveCount} of ${evidence.mustHaveMatches.length} must-have items.`,
    ];

    if (scoreBreakdown.matchedRedFlagCount > 0) {
      explanationParts.push(
        `${scoreBreakdown.matchedRedFlagCount} red flag${scoreBreakdown.matchedRedFlagCount > 1 ? 's were' : ' was'} penalized.`,
      );
    }

    if (scoreBreakdown.capsApplied.length > 0) {
      explanationParts.push(`Deterministic scoring caps applied: ${scoreBreakdown.capsApplied.join(', ')}.`);
    }

    const idealAnswerParts = [
      'A stronger answer should directly cover these must-have points:',
      ...context.rubric.mustHave.map((item) => `- ${item}`),
      ...(context.rubric.validStrategies.length > 0
        ? ['It should also use one or more of these approaches:', ...context.rubric.validStrategies.map((item) => `- ${item}`)]
        : []),
    ];

    const primaryGap = missingConcepts[0] ?? context.rubric.mustHave[0] ?? 'the core concept behind the question';

    return {
      strengths:
        strengths.length > 0 ? strengths : ['The answer made an attempt and included some topic-relevant language.'],
      missingConcepts,
      explanationForUser: explanationParts.join(' '),
      idealAnswer: idealAnswerParts.join('\n'),
      followUpQuestion: `Can you expand specifically on ${primaryGap}? Walk through your reasoning step by step.`,
    };
  }
}
