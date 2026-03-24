import type { InterviewFinalReport, InterviewSessionAnswer } from "@/lib/types";

export type FinishQuestionResult = {
  score: number;
  concept?: string | null;
  subtopic?: string | null;
  feedback: {
    explanationForUser: string;
    missingConcepts?: string[];
  };
  missedCheckpoints?: string[];
};

export type FinishResponse = {
  sessionId: string;
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: number;
  answers: InterviewSessionAnswer[];
  status: "completed";
  report: InterviewFinalReport;
  questionResults?: FinishQuestionResult[];
};
