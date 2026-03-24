import { ConstraintTemplate, QuestionFamily, RenderedQuestion, ScenarioHook, TopicId } from '../topic-pack.types';

export interface GeneratedQuestionInstance {
  questionId: string;
  topicId: TopicId;
  familyKey: string;
  archetype: QuestionFamily['archetype'];
  hookId: string;
  concepts: string[];
  subtopic: string;
  rubricId?: string;
  constraintSnapshot: Array<Pick<ConstraintTemplate, 'id' | 'label' | 'text'>>;
  rendered: RenderedQuestion;
  hook?: ScenarioHook;
  family?: QuestionFamily;
}
