import { AttemptGateResult } from './attempt-gate.types';

export type EvaluationTopic =
  | 'nodejs'
  | 'javascript'
  | 'system_design'
  | 'caching'
  | 'databases'
  | 'queues'
  | 'apis'
  | 'concurrency'
  | 'debugging'
  | 'generic';
export type EvaluationDifficulty = 'easy' | 'medium' | 'hard' | string;
export type EvaluationExperience = 'junior' | 'mid' | 'senior' | 'staff' | string;
export type ScoreProfileId = 'fundamentals' | 'debugging' | 'scenario' | 'system_design';
export type ScoreDimension = 'relevance' | 'correctness' | 'completeness' | 'reasoning' | 'communication';

export interface RubricScoringWeights {
  relevance: number;
  correctness: number;
  completeness: number;
  reasoning: number;
  communication: number;
}

export interface Rubric {
  id: string;
  profile: ScoreProfileId;
  mustHave: string[];
  niceToHave: string[];
  validStrategies: string[];
  redFlags: string[];
  scoringWeights?: Partial<RubricScoringWeights>;
}

export interface EvidenceMatch {
  rubricItem: string;
  matched: boolean;
  confidence: number;
  evidence: string[];
  rationale: string;
}

export interface EvidenceExtractionResult {
  normalizedQuestion: string;
  normalizedAnswer: string;
  mustHaveMatches: EvidenceMatch[];
  niceToHaveMatches: EvidenceMatch[];
  strategyMatches: EvidenceMatch[];
  redFlagMatches: EvidenceMatch[];
  communicationSignals: string[];
  reasoningSignals: string[];
  answerTokenCount: number;
}

export interface ScoreBreakdownDimension {
  raw: number;
  weighted: number;
  weight: number;
}

export interface ProfileScoreBreakdown {
  profile: ScoreProfileId;
  dimensions: Record<ScoreDimension, ScoreBreakdownDimension>;
  rawTotal: number;
  weightedTotal: number;
  matchedMustHaveCount: number;
  matchedNiceToHaveCount: number;
  matchedStrategyCount: number;
  matchedRedFlagCount: number;
  penaltiesApplied: number;
  capsApplied: string[];
}

export interface FeedbackPayload {
  strengths: string[];
  missingConcepts: string[];
  explanationForUser: string;
  idealAnswer: string;
  followUpQuestion: string;
}

export interface EvaluationContext {
  question: string;
  answer: string;
  rubric: Rubric;
  topic: EvaluationTopic;
  difficulty: EvaluationDifficulty;
  experience: EvaluationExperience;
  constraints?: string[];
  familyKey?: string;
  subtopic?: string;
  rubricId?: string;
  archetype?: string;
  attemptGate: AttemptGateResult;
}

export interface QuestionEvaluationResult {
  score: number;
  profile: ScoreProfileId;
  attemptGate: AttemptGateResult;
  evidence: EvidenceExtractionResult;
  scoreBreakdown: ProfileScoreBreakdown;
  feedback: FeedbackPayload;
  missedCheckpoints?: string[];
}

export interface EvaluationResultParts {
  score: number;
  scoreBreakdown: ProfileScoreBreakdown;
  feedback: FeedbackPayload;
}

export interface EvidenceExtractorInput {
  question: string;
  answer: string;
  rubric: Rubric;
  topic: EvaluationTopic;
  difficulty: EvaluationDifficulty;
  experience: EvaluationExperience;
  constraints?: string[];
}

export interface EvidenceExtractionAdapter {
  extract(input: EvidenceExtractorInput): EvidenceExtractionResult;
}

export interface ScoreProfile {
  id: ScoreProfileId;
  label: string;
  weights: RubricScoringWeights;
  redFlagPenalty: number;
}
