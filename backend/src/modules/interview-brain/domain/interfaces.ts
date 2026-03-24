import { Difficulty, ExperienceBand, QuestionType, Topic } from './enums';

export interface Concept {
  id: string;
  topic: Topic;
  subtopic: string;
  name: string;
  description: string;
  prerequisites?: string[];
}

export interface QuestionTemplate {
  id: string;
  topic: Topic;
  subtopic: string;
  concepts: string[];
  type: QuestionType;
  difficulty: Difficulty;
  experienceBands: ExperienceBand[];
  template: string;
  engagementHook?: string;
  excludesWith?: string[];
  cooldownSessions?: number;
  rubricId: string;
}

export interface RubricScoringWeights {
  relevance: number;
  correctness: number;
  completeness: number;
  reasoning: number;
  communication: number;
}

export interface Rubric {
  id: string;
  topic: Topic;
  type: QuestionType;
  mustHave: string[];
  niceToHave: string[];
  validStrategies: string[];
  redFlags: string[];
  scoringWeights: RubricScoringWeights;
}

export interface UserConceptMastery {
  userId: string;
  conceptId: string;
  attempts: number;
  strongAttempts: number;
  recentScores: number[];
  confidence: number;
  mastered: boolean;
  lastSeenAt?: string;
  cooldownUntilSession?: number;
}

export interface InterviewSessionPlan {
  sessionId: string;
  userId: string;
  topic: Topic;
  difficulty: Difficulty;
  experience: ExperienceBand;
  totalQuestions: number;
  plannedQuestionIds: string[];
  askedQuestionIds: string[];
  targetedConcepts: string[];
  status: 'planned' | 'in_progress' | 'completed';
}
