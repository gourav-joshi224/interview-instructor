export type InterviewSetup = {
  topic: string;
  experience: string;
  difficulty: string;
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
