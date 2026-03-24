export type InterviewSetup = {
  topic: string;
  experience: string;
  difficulty: string;
  mode?: "standard" | "resume";
  selectedSkill?: string;
  totalQuestions?: number;
};

export type EvaluationResource = {
  title: string;
  url: string;
};

export type SkillBreakdown = {
  architecture: number;
  scalability: number;
  dataModeling: number;
  caching: number;
};

export type EvaluationResult = {
  score: number;
  strengths: string[];
  missingConcepts: string[];
  explanationForUser: string;
  idealAnswer: string;
  followUpQuestion: string;
  skillBreakdown: SkillBreakdown;
  learningResources: EvaluationResource[];
  interviewId?: string;
  cached?: boolean;
};

export type StoredInterviewResult = InterviewSetup &
  EvaluationResult & {
    question: string;
    answer: string;
  };

export type DashboardInsight = {
  strongestSkill: keyof SkillBreakdown;
  weakestSkill: keyof SkillBreakdown;
  strongestMessage: string;
  improvementMessage: string;
};

export type DashboardData = {
  interviews: StoredInterviewResult[];
  averages: SkillBreakdown;
  latestScores: Array<{
    interviewId: string;
    label: string;
    score: number;
  }>;
  insight: DashboardInsight;
};

export type SessionStatus = "in_progress" | "completed";

export type InterviewSessionAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type DynamicSkillScore = {
  skill: string;
  score: number;
};

export type InterviewFinalReport = {
  overallScore: number;
  strengths: string[];
  weakAreas: string[];
  communicationFeedback: string;
  technicalFeedback: string;
  improvementPlan: string;
  skillBreakdown: DynamicSkillScore[];
  learningResources: EvaluationResource[];
};

export type InterviewSessionSummary = InterviewSetup & {
  sessionId?: string;
  status: SessionStatus;
  answers: InterviewSessionAnswer[];
  report?: InterviewFinalReport | null;
};
