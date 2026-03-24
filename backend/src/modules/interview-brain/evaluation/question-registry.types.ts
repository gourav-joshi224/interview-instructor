import { Topic } from './attempt-gate.types';

export interface QuestionMeta {
  questionId: string;
  text: string;
  rubric: string;
  topic: Topic;
}

export interface QuestionRegistry {
  getById(questionId: string): QuestionMeta;
}
