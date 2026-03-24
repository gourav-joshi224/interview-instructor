import { EvaluationTopic, QuestionEvaluationResult } from '../evaluation';

export type MasteryState =
  | 'untested'
  | 'learning'
  | 'improving'
  | 'mastered'
  | 'needs_revision';

export interface UserConceptMastery {
  userId: string;
  conceptId: string;
  topic: EvaluationTopic;
  attempts: number;
  evaluatedAttempts: number;
  strongAttempts: number;
  weakAttempts: number;
  nonAttemptCount: number;
  recentScores: number[];
  rollingAverage: number;
  confidence: number;
  state: MasteryState;
  mastered: boolean;
  lastSeenSessionId: string | null;
  lastSeenAt: string | null;
  cooldownSessionsRemaining: number;
}

export type MasteryQuestionResult = QuestionEvaluationResult & {
  conceptIds: string[];
};

export interface MasteryUpdateInput {
  userId: string;
  sessionId: string;
  topic: EvaluationTopic;
  questionResults: MasteryQuestionResult[];
  sessionCompletedAt: string;
}

export interface MasteryUpdateSummary {
  userId: string;
  sessionId: string;
  updatedConcepts: string[];
  newlyMastered: string[];
  newlyFlaggedForRevision: string[];
}

export interface MasteryRepository {
  getByUserAndConceptIds(userId: string, conceptIds: string[]): Promise<UserConceptMastery[]>;
  upsertMany(records: UserConceptMastery[]): Promise<void>;
}

export const MASTERY_REPOSITORY = Symbol('MASTERY_REPOSITORY');
