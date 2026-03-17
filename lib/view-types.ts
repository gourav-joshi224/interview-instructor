import type { InterviewFinalReport, InterviewSessionAnswer } from "@/lib/types";

export type FinishResponse = {
  sessionId: string;
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: number;
  answers: InterviewSessionAnswer[];
  status: "completed";
  report: InterviewFinalReport;
};
