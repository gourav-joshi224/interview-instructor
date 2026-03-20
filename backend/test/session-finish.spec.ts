import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionEvaluationService } from '../src/modules/session/session-evaluation.service';
import { EvaluationContextService } from '../src/modules/interview-brain/evaluation/evaluation-context.service';
import { AttemptGateService } from '../src/modules/interview-brain/evaluation/attempt-gate.service';
import { EvidenceExtractorService } from '../src/modules/interview-brain/evaluation/evidence-extractor.service';
import { ScoreEngineService } from '../src/modules/interview-brain/evaluation/score-engine.service';
import { FeedbackGeneratorService } from '../src/modules/interview-brain/evaluation/feedback-generator.service';
import { SessionAggregatorService } from '../src/modules/interview-brain/evaluation/session-aggregation/session-aggregator.service';
import { AttemptGateResult } from '../src/modules/interview-brain/evaluation/attempt-gate.types';
import { EvaluationContext, EvidenceExtractionResult, FeedbackPayload, ProfileScoreBreakdown } from '../src/modules/interview-brain/evaluation/evaluation.types';

const buildService = () => {
  const attemptGate = new AttemptGateService();
  const evidenceExtractor = new EvidenceExtractorService();
  const scoreEngine = new ScoreEngineService();
  const feedbackGenerator = new FeedbackGeneratorService();
  const evaluationContext = new EvaluationContextService(attemptGate, evidenceExtractor, scoreEngine, feedbackGenerator);
  const aggregator = new SessionAggregatorService();
  return new SessionEvaluationService(evaluationContext, aggregator);
};

const sampleQuestions = [
  'Design a caching mechanism to store user session data, with a 30-minute expiration, and handle concurrent requests.',
  'Design a caching system for a web service that handles 1000 concurrent requests per second. Implement cache eviction and expiration.',
  'Design a caching mechanism for a microservice that handles 10,000 requests per second. What strategies would you implement to handle cache expiration and high traffic?',
  'Design a caching system for a microservice that handles 10,000 requests per second, with a 5-minute cache expiration time and a 99.99% uptime guarantee.',
  'Design a caching system for a microservice that fetches user data from a database, with a cache expiration time of 1 hour and a maximum cache size of 1000 entries.',
];

const junkAnswers = ['tggkknbbv', 'copy', 'Design a caching mechanism for a microservice that handles 10,000 requests per second.', 'same as question', "i don't know"];

const baseInput = {
  sessionId: 'test-session',
  topic: 'Caching',
  experience: 'Mid-Level',
  difficulty: 'On Call',
  totalQuestions: 5,
};

test('all garbage answers stay at zero and are flagged non-attempt', () => {
  const service = buildService();

  const answers = sampleQuestions.map((question, index) => ({ question, answer: junkAnswers[index] ?? '' }));

  const output = service.evaluate({ ...baseInput, answers });

  assert.equal(output.report.overallScore, 0);
  assert.ok(output.report.strengths[0].toLowerCase().includes('no strong'));
  output.questionResults.forEach((result) => {
    assert.equal(result.score, 0);
    assert.equal(result.attemptGate.status, 'non_attempt');
  });
});

test('one decent answer does not inflate overall score', () => {
  const service = buildService();

  const goodAnswer =
    'Use Redis as a shared cache with TTL 300s, set session keys with write-through, and evict with LRU. Add optimistic locking or versioned writes to avoid races, shard hot keys, and backstop with database reads plus circuit breakers.';
  const answers = sampleQuestions.map((question, index) => ({
    question,
    answer: index === 0 ? goodAnswer : junkAnswers[index] ?? '',
  }));

  const output = service.evaluate({ ...baseInput, answers });

  const goodResult = output.questionResults[0];
  assert.notEqual(goodResult.attemptGate.status, 'non_attempt');
  assert.ok(goodResult.score > 0);
  assert.ok(output.report.overallScore < 40);
});

test('copied question is marked non-attempt with zero score', () => {
  const service = buildService();

  const answers = [
    { question: sampleQuestions[0], answer: sampleQuestions[0] },
  ];

  const output = service.evaluate({ ...baseInput, answers, totalQuestions: 1 });

  assert.equal(output.questionResults[0].attemptGate.status, 'non_attempt');
  assert.equal(output.questionResults[0].score, 0);
});

test('weak attempt stays capped', () => {
  const service = buildService();

  const answers = [
    {
      question: sampleQuestions[1],
      answer: 'cache database redis ttl',
    },
  ];

  const output = service.evaluate({ ...baseInput, answers, totalQuestions: 1 });
  const result = output.questionResults[0];

  assert.equal(result.attemptGate.status, 'weak_attempt');
  assert.ok(result.score <= 50);
});

test('invalid evaluator score is clamped safely', () => {
  const fakeContext: EvaluationContextService = {
    evaluate: (_context: Omit<EvaluationContext, 'attemptGate'>) => {
      const attemptGate: AttemptGateResult = {
        status: 'valid_attempt',
        shouldEvaluate: true,
        scoreCap: null,
        reason: 'forced',
        signals: [],
      };

      const emptyEvidence: EvidenceExtractionResult = {
        normalizedQuestion: '',
        normalizedAnswer: '',
        mustHaveMatches: [],
        niceToHaveMatches: [],
        strategyMatches: [],
        redFlagMatches: [],
        communicationSignals: [],
        reasoningSignals: [],
        answerTokenCount: 0,
      };

      const scoreBreakdown: ProfileScoreBreakdown = {
        profile: 'system_design',
        dimensions: {
          relevance: { raw: 0, weighted: 0, weight: 0 },
          correctness: { raw: 0, weighted: 0, weight: 0 },
          completeness: { raw: 0, weighted: 0, weight: 0 },
          reasoning: { raw: 0, weighted: 0, weight: 0 },
          communication: { raw: 0, weighted: 0, weight: 0 },
        },
        rawTotal: 150,
        weightedTotal: 150,
        matchedMustHaveCount: 0,
        matchedNiceToHaveCount: 0,
        matchedStrategyCount: 0,
        matchedRedFlagCount: 0,
        penaltiesApplied: 0,
        capsApplied: [],
      };

      const feedback: FeedbackPayload = {
        strengths: [],
        missingConcepts: [],
        explanationForUser: '',
        idealAnswer: '',
        followUpQuestion: '',
      };

      return {
        score: Number.NaN,
        profile: 'system_design',
        attemptGate,
        evidence: emptyEvidence,
        scoreBreakdown,
        feedback,
      };
    },
  } as unknown as EvaluationContextService;

  const aggregator = new SessionAggregatorService();
  const service = new SessionEvaluationService(fakeContext, aggregator);

  const output = service.evaluate({
    ...baseInput,
    totalQuestions: 1,
    answers: [{ question: sampleQuestions[0], answer: 'content' }],
  });

  assert.equal(output.questionResults[0].score, 0);
  assert.equal(output.report.overallScore, 0);
});
