import { AttemptStatus, Topic } from '../attempt-gate.types';

export const EVALUATOR_SERVICE = Symbol('EVALUATOR_SERVICE');
export const QUESTION_REGISTRY = Symbol('QUESTION_REGISTRY');

// Score bands are intentionally strict so the harness catches boundary regressions.
export type BenchmarkScoreBand = 'non_attempt' | 'weak' | 'partial' | 'solid' | 'strong';

export interface BenchmarkCase {
  id: string;
  topic: Topic;
  questionId: string;
  answer: string;
  expectedBand: BenchmarkScoreBand;
  expectedStatus: AttemptStatus;
  mustMatchSignals?: string[];
  notes?: string[];
}

export interface BenchmarkCaseResult {
  caseId: string;
  passed: boolean;
  actualStatus: AttemptStatus;
  expectedStatus: AttemptStatus;
  statusMatch: boolean;
  actualBand: BenchmarkScoreBand;
  expectedBand: BenchmarkScoreBand;
  bandMatch: boolean;
  actualScore: number | null;
  reason: string;
  signals: string[];
  signalsMatch: boolean;
}

export interface BenchmarkRunSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: string;
  failures: BenchmarkCaseResult[];
  byTopic: Record<Topic, { total: number; passed: number }>;
}
