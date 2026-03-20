import {
  EvaluationDifficulty,
  EvaluationExperience,
  EvaluationTopic,
  QuestionEvaluationResult,
} from '../evaluation.types';

export type ReadinessBand =
  | 'not_ready'
  | 'fundamentals_needed'
  | 'improving'
  | 'interview_capable'
  | 'strong_ready';

export interface SessionQuestionAggregationResult extends QuestionEvaluationResult {
  concept?: string | null;
  subtopic?: string | null;
  difficulty?: EvaluationDifficulty | null;
}

export interface SessionAggregationInput {
  sessionId: string;
  topic: EvaluationTopic;
  difficulty: EvaluationDifficulty;
  experience: EvaluationExperience;
  totalQuestions: number;
  questionResults: SessionQuestionAggregationResult[];
}

export interface ConceptPerformance {
  concept: string;
  averageScore: number;
  attempts: number;
  weakCount: number;
  nonAttemptCount: number;
}

export interface SessionReport {
  sessionId: string;
  topic: EvaluationTopic;
  difficulty: EvaluationDifficulty;
  experience: EvaluationExperience;
  totalQuestions: number;
  overallScore: number;
  readinessBand: ReadinessBand;
  nonAttemptCount: number;
  weakAttemptCount: number;
  evaluatedCount: number;
  conceptPerformance: ConceptPerformance[];
  strongestAreas: ConceptPerformance[];
  weakestAreas: ConceptPerformance[];
  repeatedMissingConcepts: string[];
  studyPlan: string[];
  summary: string;
}
