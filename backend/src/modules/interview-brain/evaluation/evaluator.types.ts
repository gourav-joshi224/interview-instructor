import { Topic } from './attempt-gate.types';

export interface EvaluatorInput {
  question: string;
  rubric: string;
  answer: string;
  topic: Topic;
}

export interface EvaluatorOutput {
  score: number; // 0-100
  feedback: string;
  mustHits: string[];
  missedHits: string[];
}

export interface EvaluatorService {
  evaluate(input: EvaluatorInput): Promise<EvaluatorOutput>;
}
