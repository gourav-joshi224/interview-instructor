// @ts-nocheck
// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { QuestionRendererService, QuestionValidatorService } from '../src/modules/interview-brain/content';
import { getTopicPack } from '../src/modules/interview-brain/content/topic-pack.registry';
import { QuestionAssemblyService } from '../src/modules/interview-brain/content/runtime/question-assembly.service';
import { PlannerService } from '../src/modules/interview-brain/planner/planner.service';
import { MasteryFilterService } from '../src/modules/interview-brain/planner/mastery-filter.service';
import { HistoryFilterService } from '../src/modules/interview-brain/planner/history-filter.service';
import { RulesService } from '../src/modules/interview-brain/planner/rules.service';
import { SessionEvaluationService } from '../src/modules/session/session-evaluation.service';
import { EvaluationContextService } from '../src/modules/interview-brain/evaluation/evaluation-context.service';
import { AttemptGateService } from '../src/modules/interview-brain/evaluation/attempt-gate.service';
import { EvidenceExtractorService } from '../src/modules/interview-brain/evaluation/evidence-extractor.service';
import { ScoreEngineService } from '../src/modules/interview-brain/evaluation/score-engine.service';
import { FeedbackGeneratorService } from '../src/modules/interview-brain/evaluation/feedback-generator.service';
import { SessionAggregatorService } from '../src/modules/interview-brain/evaluation/session-aggregation/session-aggregator.service';
import { StoredQuestionPlanItem } from '../src/modules/storage/storage.service';
import { countWords } from '../src/modules/interview-brain/content/renderer/question-finalizer.util';

const buildAssembly = () => {
  const rules = new RulesService();
  const mastery = new MasteryFilterService();
  const history = new HistoryFilterService();
  const planner = new PlannerService(rules, mastery, history);
  const renderer = new QuestionRendererService();
  const validator = new QuestionValidatorService();
  const assembly = new QuestionAssemblyService(planner, renderer, validator);
  return { assembly, renderer };
};

const buildEvaluation = () => {
  const attemptGate = new AttemptGateService();
  const evidenceExtractor = new EvidenceExtractorService();
  const scoreEngine = new ScoreEngineService();
  const feedbackGenerator = new FeedbackGeneratorService();
  const evaluationContext = new EvaluationContextService(attemptGate, evidenceExtractor, scoreEngine, feedbackGenerator);
  const aggregator = new SessionAggregatorService();
  return new SessionEvaluationService(evaluationContext, aggregator);
};

test('JavaScript session yields diverse rendered questions and familyKeys', () => {
  const { assembly } = buildAssembly();
  const instances = assembly.assemble({
    topicId: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 5,
  });

  assert.ok(instances.length === 5);
  const texts = new Set(instances.map((i) => i.rendered.text));
  const familyKeys = new Set(instances.map((i) => i.familyKey));

  assert.ok(texts.size === instances.length, 'renderedQuestion should not repeat');
  assert.ok(familyKeys.size >= 3, 'should include at least 3 distinct familyKeys');
});

test('Evaluation uses stored metadata to resolve profile/rubric', () => {
  const { assembly } = buildAssembly();
  const evaluation = buildEvaluation();

  const instances = assembly.assemble({
    topicId: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
  });

  const questionPlan: StoredQuestionPlanItem[] = instances.map((instance) => ({
    questionId: instance.questionId,
    topicId: instance.topicId,
    familyKey: instance.familyKey,
    archetype: instance.archetype,
    hookId: instance.hookId,
    concepts: instance.concepts,
    subtopic: instance.subtopic,
    rubricId: instance.rubricId,
    constraintSnapshot: instance.constraintSnapshot,
    renderedQuestion: instance.rendered.text,
  }));

  const jsResult = evaluation.evaluate({
    sessionId: 's1',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ question: instances[0].rendered.text, answer: 'sample answer' }],
    questionPlan,
  });

  assert.notEqual(jsResult.questionResults[0].profile, 'system_design');

  const sdResult = evaluation.evaluate({
    sessionId: 's2',
    topic: 'system design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ question: 'Design a cache', answer: 'content' }],
    questionPlan: [
      {
        questionId: 'sd-q1',
        topicId: 'system-design',
        familyKey: 'sd-family',
        archetype: 'architecture',
        hookId: 'sd-hook',
        concepts: ['caching'],
        subtopic: 'caching',
        rubricId: 'sd-rubric',
        constraintSnapshot: [],
        renderedQuestion: 'Design a cache',
      },
    ],
  });

  assert.equal(sdResult.questionResults[0].profile, 'system_design');
});

test('Renderer returns distinct text per JavaScript family', () => {
  const { renderer } = buildAssembly();

  const eventLoop = renderer.render({ topicId: 'javascript', familyKey: 'javascript.event_loop' });
  const hoisting = renderer.render({ topicId: 'javascript', familyKey: 'javascript.hoisting' });
  const closures = renderer.render({ topicId: 'javascript', familyKey: 'javascript.closures' });

  assert.notEqual(eventLoop.text, hoisting.text);
  assert.notEqual(eventLoop.text, closures.text);
  assert.notEqual(hoisting.text, closures.text);
});

test('JS event loop question is concise and de-duplicated', () => {
  const renderer = new QuestionRendererService();
  const question = renderer.render({
    topicId: 'javascript',
    familyKey: 'javascript.event_loop',
    hookId: 'js-memory-leak',
    constraintIds: ['js-latency'],
  });

  const wordTotal = countWords(question.text);
  const loopMentions = (question.text.match(/event loop/gi) ?? []).length;
  const microtaskMentions = (question.text.match(/microtask/gi) ?? []).length;
  const hookRepeats = (question.text.match(/Memory leak in SPA/gi) ?? []).length;

  assert.ok(wordTotal <= 45, `question too long: ${wordTotal} words`);
  assert.ok(loopMentions <= 2);
  assert.ok(microtaskMentions <= 2);
  assert.ok(hookRepeats <= 1);
});

test('Renderer keeps concept labels under control', () => {
  const renderer = new QuestionRendererService();
  const question = renderer.render({ topicId: 'javascript', familyKey: 'javascript.promises_async' });

  const promisesMentions = (question.text.match(/promise|async/gi) ?? []).length;

  assert.ok(promisesMentions <= 2, 'concept labels should not be spammed');
  assert.ok(countWords(question.text) <= 45);
});

test('Validator rejects bloated concatenated drafts', () => {
  const validator = new QuestionValidatorService();
  const bloated = {
    topicId: 'javascript',
    familyKey: 'javascript.event_loop',
    hookId: 'js-memory-leak',
    constraintIds: ['js-latency'],
    skeleton: '',
    text:
      'Use the event loop to fix "Memory leak in SPA": detail macro vs microtask ordering and its impact on rendering. Timers vs microtasks vs rendering frames. Memory leak in SPA: Long-running SPA slows down. Heap grows after navigation. Focus on Event Loop, Promises & Async/Await. Constraints: UI thread must not block more than 16ms per frame.',
  } as any;

  const result = validator.validate(bloated, {
    askedQuestions: [],
    usedFamilyKeys: [],
    usedSkeletons: [],
    usedHookIds: [],
  });

  assert.equal(result.valid, false);
  assert.ok(
    result.reasons.some((r) =>
      ['bloated-question', 'concept-overlap-high', 'duplicated-fragment', 'word-count-exceeded'].includes(r),
    ),
  );
});

test('Fallback rubric is logged when metadata missing', () => {
  const evaluation = buildEvaluation();
  const originalDebug = process.env.INTERVIEW_DEBUG;
  process.env.INTERVIEW_DEBUG = 'true';
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };
  const sdPack = getTopicPack('system-design');
  const jsPack = getTopicPack('javascript');
  const savedSdTemplates = [...sdPack.rubricTemplates];
  const savedJsTemplates = [...jsPack.rubricTemplates];
  sdPack.rubricTemplates.length = 0;
  jsPack.rubricTemplates.length = 0;

  const output = evaluation.evaluate({
    sessionId: 's-missing',
    topic: 'javascript',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
    answers: [{ question: 'Sample question', answer: 'answer' }],
  });

  console.log = originalLog;
  process.env.INTERVIEW_DEBUG = originalDebug;
  sdPack.rubricTemplates.push(...savedSdTemplates);
  jsPack.rubricTemplates.push(...savedJsTemplates);

  assert.equal(output.questionResults[0].profile, 'fundamentals');
  assert.ok(
    logs.some((line) => line.includes('fallbackRubric') || line.includes('fallbackUsed=true')),
    'should log fallback rubric resolution',
  );
});
