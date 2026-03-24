import { Inject, Injectable } from '@nestjs/common';
import { AttemptGateService } from '../attempt-gate.service';
import { AttemptStatus, Topic } from '../attempt-gate.types';
import { EvaluatorService } from '../evaluator.types';
import { QuestionMeta, QuestionRegistry } from '../question-registry.types';
import {
  BenchmarkCase,
  BenchmarkCaseResult,
  BenchmarkRunSummary,
  EVALUATOR_SERVICE,
  QUESTION_REGISTRY,
} from './benchmark.types';
import { scoreToBand } from './score-band.util';

@Injectable()
export class BenchmarkRunnerService {
  constructor(
    private readonly attemptGate: AttemptGateService,
    @Inject(EVALUATOR_SERVICE) private readonly evaluator: EvaluatorService,
    @Inject(QUESTION_REGISTRY) private readonly registry: QuestionRegistry,
  ) {}

  // A case passes only when status matches, band matches, and all required signals are present.
  // This harness intentionally uses strict score-band boundaries with no tolerance so boundary
  // regressions in AttemptGate + Evaluator integration cannot hide behind fuzzy matching.
  async runSuite(cases: BenchmarkCase[]): Promise<BenchmarkRunSummary> {
    const results: BenchmarkCaseResult[] = [];
    const caseTopicMap = new Map(cases.map((benchmarkCase) => [benchmarkCase.id, benchmarkCase.topic]));

    for (const benchmarkCase of cases) {
      results.push(await this.runCase(benchmarkCase));
    }

    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;
    const emptyTotals: Record<Topic, { total: number; passed: number }> = {
      nodejs: { total: 0, passed: 0 },
      javascript: { total: 0, passed: 0 },
      system_design: { total: 0, passed: 0 },
      caching: { total: 0, passed: 0 },
      databases: { total: 0, passed: 0 },
      queues: { total: 0, passed: 0 },
      apis: { total: 0, passed: 0 },
      concurrency: { total: 0, passed: 0 },
      debugging: { total: 0, passed: 0 },
      generic: { total: 0, passed: 0 },
    };

    const byTopic = results.reduce<Record<Topic, { total: number; passed: number }>>(
      (accumulator, result) => {
        const topic = caseTopicMap.get(result.caseId);

        if (!topic) {
          return accumulator;
        }

        const current = accumulator[topic];
        current.total += 1;
        if (result.passed) {
          current.passed += 1;
        }
        return accumulator;
      },
      { ...emptyTotals },
    );

    return {
      total: results.length,
      passed,
      failed,
      passRate: `${((passed / Math.max(results.length, 1)) * 100).toFixed(1)}%`,
      failures: results.filter((result) => !result.passed),
      byTopic,
    };
  }

  private async runCase(benchmarkCase: BenchmarkCase): Promise<BenchmarkCaseResult> {
    let questionMeta: QuestionMeta | undefined;

    try {
      questionMeta = this.registry.getById(benchmarkCase.questionId);
      if (!questionMeta) {
        throw new Error('missing_question');
      }
    } catch {
      return this.buildResult(benchmarkCase, {
        actualStatus: 'non_attempt',
        actualBand: 'non_attempt',
        actualScore: null,
        reason: `question_not_found: ${benchmarkCase.questionId}`,
        signals: ['question_not_found'],
      });
    }

    const gateResult = this.attemptGate.evaluate({
      question: questionMeta.text,
      answer: benchmarkCase.answer,
      topic: benchmarkCase.topic,
    });

    if (!gateResult.shouldEvaluate) {
      return this.buildResult(benchmarkCase, {
        actualStatus: gateResult.status,
        actualBand: scoreToBand(0),
        actualScore: 0,
        reason: gateResult.reason,
        signals: gateResult.signals,
      });
    }

    try {
      const evaluatorOutput = await this.evaluator.evaluate({
        question: questionMeta.text,
        rubric: questionMeta.rubric,
        answer: benchmarkCase.answer,
        topic: benchmarkCase.topic,
      });

      if (!Number.isFinite(evaluatorOutput.score) || evaluatorOutput.score < 0 || evaluatorOutput.score > 100) {
        return this.buildResult(benchmarkCase, {
          actualStatus: gateResult.status,
          actualBand: 'non_attempt',
          actualScore: null,
          reason: 'invalid_evaluator_score',
          signals: ['invalid_evaluator_score'],
        });
      }

      const cappedScore =
        gateResult.scoreCap === null ? evaluatorOutput.score : Math.min(evaluatorOutput.score, gateResult.scoreCap);

      return this.buildResult(benchmarkCase, {
        actualStatus: gateResult.status,
        actualBand: scoreToBand(cappedScore),
        actualScore: cappedScore,
        reason: gateResult.reason,
        signals: gateResult.signals,
      });
    } catch (error) {
      const message = error instanceof Error && error.message.length > 0 ? error.message : 'unknown_error';

      return this.buildResult(benchmarkCase, {
        actualStatus: gateResult.status,
        actualBand: 'non_attempt',
        actualScore: null,
        reason: `evaluator_threw: ${message}`,
        signals: ['evaluator_threw'],
      });
    }
  }

  private buildResult(
    benchmarkCase: BenchmarkCase,
    actual: {
      actualStatus: AttemptStatus;
      actualBand: BenchmarkCaseResult['actualBand'];
      actualScore: number | null;
      reason: string;
      signals: string[];
    },
  ): BenchmarkCaseResult {
    const statusMatch = actual.actualStatus === benchmarkCase.expectedStatus;
    const bandMatch = actual.actualBand === benchmarkCase.expectedBand;
    const signalsMatch =
      benchmarkCase.mustMatchSignals === undefined ||
      benchmarkCase.mustMatchSignals.every((signal) => actual.signals.includes(signal));

    return {
      caseId: benchmarkCase.id,
      passed: statusMatch && bandMatch && signalsMatch,
      actualStatus: actual.actualStatus,
      expectedStatus: benchmarkCase.expectedStatus,
      statusMatch,
      actualBand: actual.actualBand,
      expectedBand: benchmarkCase.expectedBand,
      bandMatch,
      actualScore: actual.actualScore,
      reason: actual.reason,
      signals: actual.signals,
      signalsMatch,
    };
  }
}
