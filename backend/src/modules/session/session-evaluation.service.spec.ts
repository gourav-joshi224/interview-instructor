// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionEvaluationService } from './session-evaluation.service';
import { StoredQuestionPlanItem } from '../storage/storage.service';
import { ScoreProfileId } from '../interview-brain/evaluation/evaluation.types';
import { getTopicPack } from '../interview-brain/content/topic-pack.registry';

class FakeEvaluationContext {
  public lastRubric = null;
  public lastInput: any = null;
  evaluate(input: any) {
    this.lastRubric = input.rubric;
    this.lastInput = input;
    const matchedMustHaveCount = input.rubric.mustHave.filter((item: string) =>
      input.answer.toLowerCase().includes(item.toLowerCase().split(' ')[0]),
    ).length;
    return {
      score: matchedMustHaveCount * 10,
      profile: input.rubric.profile as ScoreProfileId,
      attemptGate: { status: matchedMustHaveCount > 0 ? 'valid_attempt' : 'non_attempt', shouldEvaluate: true, scoreCap: null, reason: '', signals: [] },
      evidence: {
        normalizedQuestion: '',
        normalizedAnswer: '',
        mustHaveMatches: [],
        niceToHaveMatches: [],
        strategyMatches: [],
        redFlagMatches: [],
        communicationSignals: [],
        reasoningSignals: [],
        answerTokenCount: 0,
      },
      scoreBreakdown: {
        profile: input.rubric.profile as ScoreProfileId,
        dimensions: {
          relevance: { raw: 0, weighted: 0, weight: 0 },
          correctness: { raw: 0, weighted: 0, weight: 0 },
          completeness: { raw: 0, weighted: 0, weight: 0 },
          reasoning: { raw: 0, weighted: 0, weight: 0 },
          communication: { raw: 0, weighted: 0, weight: 0 },
        },
        rawTotal: matchedMustHaveCount,
        weightedTotal: matchedMustHaveCount,
        matchedMustHaveCount,
        matchedNiceToHaveCount: 0,
        matchedStrategyCount: 0,
        matchedRedFlagCount: 0,
        penaltiesApplied: 0,
        capsApplied: [],
      },
      feedback: {
        strengths: [],
        missingConcepts: [],
        explanationForUser: '',
        idealAnswer: '',
        followUpQuestion: '',
      },
    };
  }
}

class FakeAggregator {
  constructor(private readonly missing: string[] = []) {}
  aggregate() {
    return {
      overallScore: 0,
      repeatedMissingConcepts: this.missing,
      nonAttemptCount: 0,
      weakAttemptCount: 0,
      studyPlan: [],
      conceptPerformance: [],
    };
  }
}

const buildService = (options?: { missingConcepts?: string[] }) => {
  const context = new FakeEvaluationContext();
  const aggregator = new FakeAggregator(options?.missingConcepts ?? []);
  const service = new SessionEvaluationService(context as any, aggregator as any);
  return { service, context };
};

const buildPlanItem = (overrides: Partial<StoredQuestionPlanItem>): StoredQuestionPlanItem => ({
  questionId: 'q1',
  topicId: 'javascript',
  familyKey: 'javascript.event_loop',
  archetype: 'runtime',
  hookId: 'hook',
  concepts: ['js-event-loop'],
  subtopic: 'ordering',
  rubricId: 'js-runtime-rubric',
  constraintSnapshot: [],
  renderedQuestion: 'Explain event loop ordering',
  ...overrides,
});

test('Direct rubricId match uses template content (resolvedLevel 0)', () => {
  const { service, context } = buildService();
  process.env.INTERVIEW_DEBUG = 'true';
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  service.evaluate({
    sessionId: 's1',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'event loop phases' }],
    questionPlan: [buildPlanItem({ rubricId: 'js-runtime-rubric' })],
  });

  console.log = originalLog;
  assert.ok(context.lastRubric.mustHave.includes('Explains event loop ordering'));
  assert.ok(logs.some((line) => line.includes('resolvedLevel=0')));
  assert.ok(logs.some((line) => line.includes('fallbackUsed=false')));
});

test('familyKey + subtopic lookup is used when rubricId is missing (resolvedLevel 1)', () => {
  const { service, context } = buildService();
  const pack = getTopicPack('javascript');
  pack.rubricTemplates.push({
    id: 'javascript.event_loop-ordering',
    topicId: 'javascript',
    archetype: 'runtime',
    mustHave: ['ordering rubric hit'],
    niceToHave: [],
    redFlags: [],
    scoringWeights: { clarity: 0.2, correctness: 0.2, depth: 0.2, pragmatism: 0.2, safety: 0.2 },
  });

  process.env.INTERVIEW_DEBUG = 'true';
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  service.evaluate({
    sessionId: 's2',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'ordering rubric hit' }],
    questionPlan: [buildPlanItem({ rubricId: '', familyKey: 'javascript.event_loop', subtopic: 'ordering' })],
  });

  console.log = originalLog;
  pack.rubricTemplates.pop();

  assert.ok(context.lastRubric.mustHave.includes('ordering rubric hit'));
});

test('Generic fallback only when all lookups fail (resolvedLevel 4)', () => {
  const { service, context } = buildService();
  process.env.INTERVIEW_DEBUG = 'true';
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  const sdPack = getTopicPack('system-design');
  const savedTemplates = [...sdPack.rubricTemplates];
  sdPack.rubricTemplates.length = 0;

  service.evaluate({
    sessionId: 's3',
    topic: 'unknown',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'nothing' }],
    questionPlan: [
      buildPlanItem({
        topicId: 'unknown',
        rubricId: 'nonexistent',
        familyKey: 'none',
        subtopic: 'none',
      }),
    ],
  });

  console.log = originalLog;
  sdPack.rubricTemplates.push(...savedTemplates);
  assert.ok(context.lastRubric.mustHave.some((item: string) => item.includes('State the main requirement')));
  assert.ok(logs.some((line) => line.includes('resolvedLevel=3')));
  assert.ok(logs.some((line) => line.includes('fallbackUsed=true')));
});

test('System design rubric resolves to system_design profile', () => {
  const { service, context } = buildService();

  service.evaluate({
    sessionId: 's4',
    topic: 'system design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'design' }],
    questionPlan: [
      {
        ...buildPlanItem({}),
        topicId: 'system-design',
        rubricId: 'sd-architecture-rubric',
        familyKey: 'sd-api-gateway',
        subtopic: 'architecture',
      },
    ],
  });

  assert.equal(context.lastRubric.profile, 'system_design');
  assert.notEqual(context.lastRubric.id, 'js-runtime-rubric');
});

test('Different rubrics produce different must-have coverage', () => {
  const { service, context } = buildService();

  const jsResult = service.evaluate({
    sessionId: 's5',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'Explains event loop ordering and microtask queue' }],
    questionPlan: [buildPlanItem({ rubricId: 'js-runtime-rubric' })],
  });

  const sdResult = service.evaluate({
    sessionId: 's6',
    topic: 'system design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'Explains event loop ordering and microtask queue' }],
    questionPlan: [
      {
        ...buildPlanItem({}),
        topicId: 'system-design',
        rubricId: 'sd-architecture-rubric',
        familyKey: 'sd-api-gateway',
      },
    ],
  });

  assert.notEqual(jsResult.questionResults[0].scoreBreakdown.matchedMustHaveCount, sdResult.questionResults[0].scoreBreakdown.matchedMustHaveCount);
});

test('Fallback logging includes resolvedLevel and fallbackUsed flags', () => {
  const { service } = buildService();
  process.env.INTERVIEW_DEBUG = 'true';
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  const sdPack = getTopicPack('system-design');
  const savedTemplates = [...sdPack.rubricTemplates];
  sdPack.rubricTemplates.length = 0;

  service.evaluate({
    sessionId: 's7',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'none' }],
    questionPlan: [
      buildPlanItem({ topicId: 'unknown', rubricId: 'missing', familyKey: 'missing', subtopic: 'missing' }),
    ],
  });

  console.log = originalLog;
  sdPack.rubricTemplates.push(...savedTemplates);
  assert.ok(logs.some((line) => line.includes('resolvedLevel=3')));
  assert.ok(logs.some((line) => line.includes('fallbackUsed=true')));
});

test('Archetype overrides profile to debugging', () => {
  const { service, context } = buildService();

  service.evaluate({
    sessionId: 's8',
    topic: 'nodejs',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'stack trace' }],
    questionPlan: [
      buildPlanItem({ questionId: 'q1', topicId: 'nodejs', archetype: 'debugging', rubricId: 'js-runtime-rubric' }),
    ],
  });

  assert.equal(context.lastRubric.profile, 'debugging');
});

test('Learning resources align to missing concepts', () => {
  const { service } = buildService({ missingConcepts: ['event_loop', 'caching'] });

  const result = service.evaluate({
    sessionId: 's9',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'event loop' }],
    questionPlan: [buildPlanItem({ questionId: 'q1' })],
  });

  const urls = result.report.learningResources.map((r) => r.url);
  assert.ok(urls.some((url) => url?.includes('event-loop')));
  assert.ok(urls.some((url) => url?.includes('caching')));
  assert.ok(!urls.some((url) => url?.includes('system-design-primer')));
});

test('Per-question constraintSnapshot reaches evaluation context', () => {
  const { service, context } = buildService();

  service.evaluate({
    sessionId: 's10',
    topic: 'system design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'architecture' }],
    questionPlan: [
      buildPlanItem({
        questionId: 'q1',
        constraintSnapshot: [{ id: 'c1', label: 'rps', text: 'Must handle 10k RPS' }],
      }),
    ],
  });

  assert.ok(context.lastInput.constraints.includes('Must handle 10k RPS'));
});

test('System design topic maps to system_design profile', () => {
  const { service, context } = buildService();

  service.evaluate({
    sessionId: 's11',
    topic: 'system design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ questionId: 'q1', question: 'q', answer: 'design' }],
    questionPlan: [
      buildPlanItem({
        questionId: 'q1',
        topicId: 'system-design',
        familyKey: 'sd-api-gateway',
        rubricId: 'sd-architecture-rubric',
      }),
    ],
  });

  assert.equal(context.lastRubric.profile, 'system_design');
});

test('Node module resolution uses the interop rubric instead of shutdown criteria', () => {
  const { service, context } = buildService();

  service.evaluate({
    sessionId: 'node-interop',
    topic: 'nodejs',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [
      {
        questionId: 'q1',
        question: 'Fix module resolution problems after moving to ESM.',
        answer: 'CommonJS require and ESM import differ, exports controls entrypoints, and circular dependencies can break init order.',
      },
    ],
    questionPlan: [
      buildPlanItem({
        topicId: 'nodejs',
        familyKey: 'node-interop-family',
        archetype: 'architecture',
        subtopic: 'node-module-resolution',
        rubricId: 'node-interop-rubric',
      }),
    ],
  });

  assert.ok(context.lastRubric.mustHave.includes('Distinguishes CommonJS require() from ESM import'));
  assert.ok(!context.lastRubric.mustHave.includes('Graceful shutdown on SIGTERM'));
});
