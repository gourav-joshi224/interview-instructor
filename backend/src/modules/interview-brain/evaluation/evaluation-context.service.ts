import { Injectable } from '@nestjs/common';
import { AttemptGateService } from './attempt-gate.service';
import { EvidenceExtractorService } from './evidence-extractor.service';
import { FeedbackGeneratorService } from './feedback-generator.service';
import { ScoreEngineService } from './score-engine.service';
import {
  EvaluationContext,
  EvidenceExtractorInput,
  QuestionEvaluationResult,
} from './evaluation.types';

@Injectable()
export class EvaluationContextService {
  constructor(
    private readonly attemptGateService: AttemptGateService,
    private readonly evidenceExtractorService: EvidenceExtractorService,
    private readonly scoreEngineService: ScoreEngineService,
    private readonly feedbackGeneratorService: FeedbackGeneratorService,
  ) {}

  public evaluate(context: Omit<EvaluationContext, 'attemptGate'>): QuestionEvaluationResult {
    const attemptGate = this.attemptGateService.evaluate({
      question: context.question,
      answer: context.answer,
      topic: context.topic,
    });

    // Hard-stop: non-attempts should never flow through evidence extraction or scoring.
    if (!attemptGate.shouldEvaluate) {
      return {
        score: 0,
        profile: context.rubric.profile,
        attemptGate,
        evidence: {
          normalizedQuestion: context.question,
          normalizedAnswer: context.answer,
          mustHaveMatches: [],
          niceToHaveMatches: [],
          strategyMatches: [],
          redFlagMatches: [],
          communicationSignals: [],
          reasoningSignals: [],
          answerTokenCount: 0,
        },
        scoreBreakdown: {
          profile: context.rubric.profile,
          dimensions: {
            relevance: { raw: 0, weighted: 0, weight: 0 },
            correctness: { raw: 0, weighted: 0, weight: 0 },
            completeness: { raw: 0, weighted: 0, weight: 0 },
            reasoning: { raw: 0, weighted: 0, weight: 0 },
            communication: { raw: 0, weighted: 0, weight: 0 },
          },
          rawTotal: 0,
          weightedTotal: 0,
          matchedMustHaveCount: 0,
          matchedNiceToHaveCount: 0,
          matchedStrategyCount: 0,
          matchedRedFlagCount: 0,
          penaltiesApplied: 0,
          capsApplied: ['non_attempt_zero'],
        },
        feedback: {
          strengths: [],
          missingConcepts: context.rubric.mustHave.slice(0, 3),
          explanationForUser: attemptGate.reason ?? 'No attempt detected for this question.',
          idealAnswer: context.rubric.mustHave.map((item) => `- ${item}`).join('\n'),
          followUpQuestion: 'Please provide a complete attempt so we can evaluate your approach.',
        },
      };
    }

    const fullContext: EvaluationContext = {
      ...context,
      attemptGate,
    };

    const evidence = this.evidenceExtractorService.extract(this.toEvidenceExtractorInput(fullContext));
    const { score, scoreBreakdown } = this.scoreEngineService.score(fullContext, evidence);
    const feedback = this.feedbackGeneratorService.generate(fullContext, evidence, scoreBreakdown);

    return {
      score,
      profile: fullContext.rubric.profile,
      attemptGate,
      evidence,
      scoreBreakdown,
      feedback,
    };
  }

  private toEvidenceExtractorInput(context: EvaluationContext): EvidenceExtractorInput {
    return {
      question: context.question,
      answer: context.answer,
      rubric: context.rubric,
      topic: context.topic,
      difficulty: context.difficulty,
      experience: context.experience,
      constraints: context.constraints,
    };
  }
}
