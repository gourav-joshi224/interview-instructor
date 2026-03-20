import assert from 'node:assert/strict';
import test from 'node:test';

import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

import { SessionService } from '../session/session.service';
import { FinishSessionDto } from '../session/dto/finish-session.dto';
import { ProgressSessionDto } from '../session/dto/progress-session.dto';
import { QuestionAssemblyService } from '../interview-brain';
import { SessionEvaluationService } from '../session/session-evaluation.service';
import { StorageService, StoredQuestionPlanItem } from './storage.service';

const VALID_CONFIG = {
  apiKey: `AIza${'A'.repeat(24)}`,
  projectId: 'interview-gym',
};

const createConfigService = (overrides?: Partial<typeof VALID_CONFIG>) => {
  const apiKey = overrides?.apiKey ?? VALID_CONFIG.apiKey;
  const projectId = overrides?.projectId ?? VALID_CONFIG.projectId;

  return {
    get: (key: string) => {
      if (key === 'firebase.apiKey') return apiKey;
      if (key === 'firebase.projectId') return projectId;
      return '';
    },
  } as unknown as ConfigService;
};

const samplePlan: StoredQuestionPlanItem[] = [
  {
    questionId: 'q-001',
    topicId: 'system-design',
    familyKey: 'fam-1',
    archetype: 'arch',
    hookId: 'hook',
    concepts: ['c1'],
    subtopic: 'sub-1',
    rubricId: 'rubric-1',
    constraintSnapshot: [],
    renderedQuestion: 'First question?',
  },
  {
    questionId: 'q-002',
    topicId: 'system-design',
    familyKey: 'fam-2',
    archetype: 'arch',
    hookId: 'hook',
    concepts: ['c2'],
    subtopic: 'sub-2',
    rubricId: 'rubric-2',
    constraintSnapshot: [],
    renderedQuestion: 'Second question?',
  },
];

const evaluationStub: SessionEvaluationService = {
  evaluate: () => ({
    report: {
      overallScore: 0,
      strengths: [],
      weakAreas: [],
      communicationFeedback: '',
      technicalFeedback: '',
      improvementPlan: '',
      skillBreakdown: [],
      learningResources: [],
    },
    questionResults: [],
    debugTrace: [],
  }),
} as unknown as SessionEvaluationService;

const assemblyStub = { assemble: () => ({ questions: samplePlan as any, deficit: 0 }) } as unknown as QuestionAssemblyService;

test('Session schema has required fields on create', async () => {
  const originalFetch = global.fetch;
  let createdDocName = '';

  (global as any).fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.includes(':commit')) {
      const body = JSON.parse(String(init?.body ?? '{}'));
      createdDocName = body.writes?.[0]?.update?.name ?? '';

      return new Response(
        JSON.stringify({ writeResults: [{ updateTime: '2024-01-01T00:00:00Z' }], commitTime: '2024-01-01T00:00:00Z' }),
        { status: 200 },
      );
    }

    if (url.includes('/interviewSessions/')) {
      const fields = {
        topic: { stringValue: 'System Design' },
        experience: { stringValue: 'mid' },
        difficulty: { stringValue: 'medium' },
        totalQuestions: { integerValue: '2' },
        status: { stringValue: 'in_progress' },
        answers: { arrayValue: { values: [] } },
        questionPlan: {
          arrayValue: {
            values: samplePlan.map((plan) => ({
              mapValue: {
                fields: {
                  questionId: { stringValue: plan.questionId },
                  topicId: { stringValue: plan.topicId },
                  familyKey: { stringValue: plan.familyKey },
                  archetype: { stringValue: plan.archetype },
                  hookId: { stringValue: plan.hookId },
                  subtopic: { stringValue: plan.subtopic },
                  rubricId: { stringValue: plan.rubricId ?? '' },
                  renderedQuestion: { stringValue: plan.renderedQuestion },
                  concepts: { arrayValue: { values: plan.concepts.map((c) => ({ stringValue: c })) } },
                  constraintSnapshot: { arrayValue: { values: [] } },
                },
              },
            })),
          },
        },
        report: { mapValue: { fields: {} } },
        createdAt: { timestampValue: '2024-01-01T00:00:00Z' },
        updatedAt: { timestampValue: '2024-01-01T00:00:00Z' },
        userId: { nullValue: null },
        sessionVersion: { integerValue: '1' },
      };

      return new Response(
        JSON.stringify({ name: createdDocName, fields }),
        { status: 200 },
      );
    }

    throw new Error(`Unexpected fetch to ${url}`);
  };

  try {
    const storage = new StorageService(createConfigService());
    const sessionId = await storage.createInterviewSession({
      topic: 'System Design',
      experience: 'mid',
      difficulty: 'medium',
      totalQuestions: 2,
      answers: [],
      questionPlan: samplePlan,
      status: 'in_progress',
      report: null,
    });

    const session = await storage.getInterviewSession(sessionId);

    assert.equal(session?.sessionId, sessionId);
    assert.ok(session?.createdAt);
    assert.ok(!Number.isNaN(Date.parse(String((session as any).createdAt))));
    assert.ok('userId' in (session as Record<string, unknown>));
    assert.equal((session as any).userId, null);
    assert.equal((session as any).sessionVersion, 1);
  } finally {
    (global as any).fetch = originalFetch;
  }
});

test('Mock fallback is gone', () => {
  assert.throws(
    () => new StorageService(createConfigService({ apiKey: '', projectId: '' })),
    /STORAGE_INIT_FAILED: Firebase config missing/,
  );
});

test('Answer matched by questionId not index', async () => {
  class StorageStub {
    public lastUpdate: { input?: any; options?: any } = {};

    async getInterviewSession() {
      return {
        topic: 'System Design',
        experience: 'mid',
        difficulty: 'medium',
        totalQuestions: 2,
        questionPlan: samplePlan,
      };
    }

    async updateInterviewSession(_id: string, input: any, options?: any) {
      this.lastUpdate = { input, options };
    }
  }

  const storage = new StorageStub();
  const service = new SessionService(storage as any, evaluationStub, assemblyStub);

  const answers: FinishSessionDto['answers'] = [
    { questionId: 'q-002', question: 'Second question?', answer: 'b' },
    { questionId: 'q-001', question: 'First question?', answer: 'a' },
  ];

  await service.finish({ sessionId: 's-1', answers });

  assert.deepEqual(
    storage.lastUpdate.input.answers.map((a: any) => a.questionId),
    ['q-001', 'q-002'],
  );
  assert.equal(storage.lastUpdate.options?.markFinished, true);
});

test('Unknown questionId rejected', async () => {
  class StorageStub {
    async getInterviewSession() {
      return {
        topic: 'System Design',
        experience: 'mid',
        difficulty: 'medium',
        totalQuestions: 1,
        questionPlan: [samplePlan[0]],
      };
    }
  }

  const storage = new StorageStub();
  const service = new SessionService(storage as any, evaluationStub, assemblyStub);

  await assert.rejects(
    () =>
      service.finish({
        sessionId: 's-unknown',
        answers: [{ questionId: 'q-999', question: 'Ghost question?', answer: 'oops' }],
      }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 400,
  );
});

test('buildPlan failure throws, does not write session', async () => {
  class StorageStub {
    public createCalls = 0;
    async createInterviewSession() {
      this.createCalls += 1;
    }
  }

  const storage = new StorageStub();
  const failingAssembly = {
    assemble: () => {
      throw new Error('assembly failed');
    },
  } as unknown as QuestionAssemblyService;

  const service = new SessionService(storage as any, evaluationStub, failingAssembly);

  await assert.rejects(
    () =>
      service.start({
        topic: 'System Design',
        experience: 'mid',
        difficulty: 'medium',
        totalQuestions: 2,
      }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 500,
  );

  assert.equal(storage.createCalls, 0);
});

test('Progress never overwrites existing plan', async () => {
  class StorageStub {
    public lastUpdate: { input?: any; options?: any } = {};

    async getInterviewSession() {
      return {
        topic: 'System Design',
        experience: 'mid',
        difficulty: 'medium',
        totalQuestions: 2,
        questionPlan: samplePlan,
      };
    }

    async updateInterviewSession(_id: string, input: any, options?: any) {
      this.lastUpdate = { input, options };
    }
  }

  const storage = new StorageStub();
  const service = new SessionService(storage as any, evaluationStub, assemblyStub);

  const answers: ProgressSessionDto['answers'] = [
    { questionId: 'q-002', question: 'Second question?', answer: 'partial' },
  ];

  await service.progress({
    sessionId: 's-progress',
    topic: 'System Design',
    experience: 'mid',
    difficulty: 'medium',
    totalQuestions: 2,
    answers,
  });

  assert.ok(!('questionPlan' in (storage.lastUpdate.input ?? {})));
  assert.deepEqual(
    storage.lastUpdate.input.answers.map((a: any) => a.questionId),
    ['q-001', 'q-002'],
  );
  assert.equal(storage.lastUpdate.options?.markFinished, undefined);
});
