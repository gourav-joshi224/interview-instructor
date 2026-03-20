// Structured interview content model for composable question generation.
// Packs compose small, reusable pieces (concepts + hooks + constraints) so
// future topics can scale without hardcoding thousands of final question strings.

export type TopicId =
  | 'system-design'
  | 'databases'
  | 'caching'
  | 'queues'
  | 'apis'
  | 'concurrency'
  | 'javascript'
  | 'nodejs';

export type Archetype =
  | 'architecture'
  | 'performance'
  | 'reliability'
  | 'data'
  | 'integration'
  | 'runtime'
  | 'delivery';

export interface ResourceLink {
  title: string;
  url?: string;
  note?: string;
}

export interface ConceptNode {
  id: string;
  topicId: TopicId;
  title: string;
  summary: string;
  stage: 'foundation' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  signals?: string[];
  antipatterns?: string[];
  resources?: ResourceLink[];
}

export interface ScenarioHook {
  id: string;
  topicId: TopicId;
  title: string;
  backdrop: string;
  trigger: string;
  compatibleFamilies?: string[];
  failureSignals?: string[];
  relatedConcepts?: string[];
}

export interface ConstraintTemplate {
  id: string;
  topicId: TopicId;
  label: string;
  text: string;
  tags?: string[];
  whenToUse?: string;
}

export interface RubricTemplate {
  id: string;
  topicId: TopicId;
  archetype: Archetype;
  mustHave: string[];
  niceToHave: string[];
  redFlags: string[];
  scoringWeights: {
    clarity: number;
    correctness: number;
    depth: number;
    pragmatism: number;
    safety: number;
  };
}

export interface QuestionFamily {
  key: string;
  topicId: TopicId;
  archetype: Archetype;
  difficulty?: 'warm_up' | 'medium' | 'hard' | 'epic';
  stem: string;
  framing: string;
  primaryConcepts: string[];
  supportingConcepts?: string[];
  defaultConstraints?: string[];
  defaultRubricId?: string;
  phrasingSkeleton: string;
  learningObjectives?: string[];
}

export interface TopicPack {
  topicId: TopicId;
  label: string;
  description: string;
  archetypes: Archetype[];
  concepts: ConceptNode[];
  scenarioHooks: ScenarioHook[];
  constraintTemplates: ConstraintTemplate[];
  rubricTemplates: RubricTemplate[];
  questionFamilies: QuestionFamily[];
  learningResources: ResourceLink[];
}

export interface RenderedQuestion {
  topicId: TopicId;
  familyKey: string;
  hookId: string;
  constraintIds: string[];
  text: string;
  skeleton: string;
}
