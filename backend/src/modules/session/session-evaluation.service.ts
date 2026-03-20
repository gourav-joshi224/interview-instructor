import { Injectable, Logger } from '@nestjs/common';
import {
  EvaluationContextService,
  SessionAggregatorService,
  SessionAggregationInput,
  SessionQuestionAggregationResult,
} from '../interview-brain/evaluation';
import { TopicId, RubricTemplate } from '../interview-brain/content/topic-pack.types';
import { getTopicPack } from '../interview-brain/content/topic-pack.registry';
import { javascriptRubrics, nodeJsRubrics } from '../interview-brain/seeds';
import { ConceptPerformance } from '../interview-brain/evaluation/session-aggregation/session-aggregator.types';
import {
  EvaluationDifficulty,
  EvaluationExperience,
  EvaluationTopic,
  Rubric,
  ScoreProfileId,
} from '../interview-brain/evaluation/evaluation.types';
import { StoredQuestionPlanItem } from '../storage/storage.service';
import { SCORE_PROFILE_WEIGHTS } from '../interview-brain/evaluation/score-engine.service';
import { topicPacks } from '../interview-brain/content/topic-pack.registry';

const CONCEPT_TO_SKILL: Record<string, string> = {
  // Prompt aliases and normalized fallbacks
  event_loop: 'Event Loop & Async',
  closures: 'Closures & Scope',
  promises_async: 'Promises & Async/Await',
  prototype_chain: 'Prototype & Inheritance',
  hoisting: 'Hoisting & Execution Context',
  'cache-layer': 'Cache Architecture',
  'cache-stampede': 'Cache Resilience',
  system_design: 'System Design',
  databases: 'Database Design',
  concurrency: 'Concurrency',
  caching: 'Cache Architecture',
  queues: 'Queue Systems',
  apis: 'API Design',
  nodejs: 'Node.js Runtime',
  javascript: 'JavaScript Fundamentals',

  // JavaScript
  'js-event-loop': 'Event Loop & Async',
  'js-promises': 'Promises & Async/Await',
  'js-closures': 'Closures & Scope',
  'js-prototype': 'Prototype & Inheritance',
  'js-types': 'Type Coercion & Data Types',
  'js-this-binding': '`this` Binding',
  'js-memory': 'Memory Management',
  'js-modules': 'Modules & Bundling',

  // Node.js
  'node-event-loop': 'Node.js Event Loop',
  'node-streams': 'Streams & Backpressure',
  'node-module-resolution': 'Module Resolution',
  'node-error-handling': 'Error Handling',
  'node-http': 'HTTP Server Patterns',
  'node-performance': 'Performance & Profiling',
  'node-memory': 'Memory Management',
  'node-observability': 'Observability',
  'node-security': 'Security Hygiene',
  'node-worker-threads': 'Workers & Clustering',
  'node-build-deploy': 'Build & Deploy',

  // System design
  'sd-service-boundaries': 'Service Boundaries',
  'sd-backpressure': 'Backpressure & Overload Control',
  'sd-cache-strategy': 'Cache Architecture',
  'sd-read-write-paths': 'Read/Write Path Design',
  'sd-idempotency': 'Idempotency',
  'sd-queue-vs-stream': 'Queues vs Streams',
  'sd-consistency-models': 'Consistency Models',
  'sd-replication': 'Replication Strategy',
  'sd-safe-delivery': 'Safe Delivery Patterns',
  'sd-observability': 'System Observability',
  'sd-capacity-planning': 'Capacity Planning',
  'sd-sharding': 'Sharding Strategy',

  // Caching
  'cache-layering': 'Cache Architecture',
  'cache-invalidation': 'Cache Invalidation',
  'cache-resilience': 'Cache Resilience',
  'cache-hot-keys': 'Hot Key Mitigation',
  'cache-eviction-policies': 'Eviction Policies',
  'cache-consistency': 'Cache Consistency',
  'cache-population': 'Cache Population Strategy',
  'cache-observability': 'Cache Observability',

  // Databases
  'db-indexing-btree': 'Indexing & Query Access Paths',
  'db-query-plans': 'Query Planning',
  'db-connection-pooling': 'Connection Pooling',
  'db-backpressure': 'Database Backpressure',
  'db-sharding': 'Database Sharding',
  'db-hotspot-mitigation': 'Hotspot Mitigation',
  'db-data-modeling': 'Data Modeling',
  'db-backups': 'Backup & Recovery',
  'db-replication': 'Replication',
  'db-transaction-isolation': 'Transaction Isolation',

  // Concurrency
  'conc-deadlocks': 'Deadlock Handling',
  'conc-locking': 'Locking Strategies',
  'conc-parallelism': 'Parallelism',
  'conc-scheduling': 'Scheduling',
  'conc-idempotency': 'Idempotency & Reentrancy',
  'conc-race-conditions': 'Race Condition Safety',
  'conc-shared-resources': 'Shared Resource Management',
  'conc-observability': 'Concurrency Observability',
  'conc-failure-modes': 'Failure Modes',

  // Queues
  'queue-delivery-semantics': 'Delivery Semantics',
  'queue-schema': 'Message Schema Design',
  'queue-backpressure': 'Queue Backpressure',
  'queue-dlq': 'Dead Letter Queue Strategy',
  'queue-scaling': 'Queue Scaling',
  'queue-observability': 'Queue Observability',
  'queue-ordering': 'Message Ordering',
  'queue-replay': 'Replay & Recovery',
  'queue-scheduling': 'Queue Scheduling',

  // APIs
  'api-gateway-patterns': 'Gateway Architecture',
  'api-rate-limit': 'Rate Limiting',
  'api-versioning': 'API Versioning',
  'api-contracts': 'API Contracts & Schemas',
  'api-idempotency': 'API Idempotency',
  'api-error-model': 'Error Modeling',
  'api-n-plus-one': 'N+1 Mitigation',
  'api-pagination': 'Pagination & Filtering',
  'api-observability': 'API Observability',
};

type FinishInput = {
  sessionId: string;
  topic: string;
  difficulty: string;
  experience: string;
  totalQuestions: number;
  answers: Array<{ questionId: string; question: string; answer: string }>;
  questionPlan?: StoredQuestionPlanItem[];
};

type FinishOutput = {
  report: {
    overallScore: number;
    strengths: string[];
    weakAreas: string[];
    communicationFeedback: string;
    technicalFeedback: string;
    improvementPlan: string;
    skillBreakdown: Array<{ skill: string; score: number }>;
    learningResources: Array<{ title: string; url: string }>;
  };
  questionResults: SessionQuestionAggregationResult[];
  debugTrace?: Array<Record<string, unknown>>;
};

type RubricResolutionContext = {
  questionId: string;
  topicId?: string;
  familyKey?: string;
  subtopic?: string;
  rubricId?: string;
  archetype?: string;
  renderedQuestion?: string;
};

@Injectable()
export class SessionEvaluationService {
  private readonly logger = new Logger(SessionEvaluationService.name);

  constructor(
    private readonly evaluationContext: EvaluationContextService,
    private readonly sessionAggregator: SessionAggregatorService,
  ) {}

  public evaluate(input: FinishInput): FinishOutput {
    const topic = this.mapTopic(input.topic);
    const difficulty = this.mapDifficulty(input.difficulty);
    const experience = this.mapExperience(input.experience);
    const debug = process.env.INTERVIEW_DEBUG === 'true';
    const questionPlan = Array.isArray(input.questionPlan) ? input.questionPlan : [];
    const planById = new Map(questionPlan.map((item) => [item.questionId, item]));

    const questionResults: SessionQuestionAggregationResult[] = input.answers.map((item, index) => {
      const stored = planById.get(item.questionId);
      const resolvedTopic = this.mapTopic(stored?.topicId ?? topic);
      const evaluationMetadata = {
        questionId: item.questionId,
        topicId: stored?.topicId ?? undefined,
        familyKey: stored?.familyKey ?? undefined,
        subtopic: stored?.subtopic ?? undefined,
        rubricId: stored?.rubricId ?? undefined,
        archetype: stored?.archetype ?? undefined,
        renderedQuestion: stored?.renderedQuestion,
      };
      const rubricResolution = this.resolveRubric(evaluationMetadata, resolvedTopic, debug);
      const rubric = rubricResolution.rubric;
      const constraints = (stored?.constraintSnapshot ?? []).map((c) => c.text).filter(Boolean);
      // D1 fix: evaluation context now reads per-question metadata
      // previously used session-level defaults only, causing wrong rubric/profile
      const evaluation = this.evaluationContext.evaluate({
        question: stored?.renderedQuestion ?? item.question,
        answer: item.answer,
        rubric,
        topic: resolvedTopic,
        difficulty,
        experience,
        constraints,
        familyKey: evaluationMetadata.familyKey,
        subtopic: evaluationMetadata.subtopic,
        rubricId: evaluationMetadata.rubricId,
        archetype: evaluationMetadata.archetype,
      });

      const safeScore = this.sanitizeScore(evaluation.score);

      const result: SessionQuestionAggregationResult = {
        ...evaluation,
        score: safeScore,
        concept: stored?.subtopic ?? this.extractConcept(item.question),
        subtopic: stored?.subtopic ?? rubric.id,
        difficulty,
      };

      if (debug) {
        // eslint-disable-next-line no-console
        console.log(
          '[EvalCtx]',
          JSON.stringify({
            question: stored?.renderedQuestion ?? item.question,
            topic: resolvedTopic,
            familyKey: stored?.familyKey ?? 'unknown',
            rubricId: stored?.rubricId ?? rubric.id,
            profile: rubric.profile,
            subtopic: stored?.subtopic ?? null,
          }),
        );
      }

      return result;
    });

    const aggregationInput: SessionAggregationInput = {
      sessionId: input.sessionId,
      topic,
      difficulty,
      experience,
      totalQuestions: input.totalQuestions,
      questionResults,
    };

    const aggregation = this.sessionAggregator.aggregate(aggregationInput);
    const report = this.toFinalReport(aggregation, questionResults);

    const debugTrace = debug
      ? questionResults.map((result, index) => ({
          index,
          question: input.answers[index]?.question ?? '',
          gateStatus: result.attemptGate.status,
          gateSignals: result.attemptGate.signals,
          rawScore: result.scoreBreakdown.rawTotal,
          finalScore: result.score,
          capsApplied: result.scoreBreakdown.capsApplied,
          includedInAggregation: true,
        }))
      : undefined;

    return { report, questionResults, debugTrace };
  }

  private mapTopic(topic: string): EvaluationTopic {
    const normalized = topic.trim().toLowerCase();
    if (normalized.includes('node')) return 'nodejs';
    if (normalized.includes('javascript') || normalized === 'js') return 'javascript';
    if (normalized.includes('system')) return 'system_design';
    if (normalized.includes('cache')) return 'caching';
    if (normalized.includes('database')) return 'databases';
    if (normalized.includes('queue')) return 'queues';
    if (normalized.includes('api')) return 'apis';
    if (normalized.includes('concurrency')) return 'concurrency';
    if (normalized.includes('debug')) return 'debugging';
    return 'generic';
  }

  private mapDifficulty(difficulty: string): EvaluationDifficulty {
    const raw = (difficulty ?? '').trim();
    const normalized = raw.toLowerCase();
    if (['easy', 'medium', 'hard'].includes(normalized)) {
      return normalized as EvaluationDifficulty;
    }
    if (normalized === 'warm up' || normalized === 'warm-up') return raw || 'Warm Up';
    if (normalized === 'on call' || normalized === 'on-call') return raw || 'On Call';
    if (normalized === 'incident mode' || normalized === 'incident-mode') return raw || 'Incident Mode';
    return raw || 'medium';
  }

  private mapExperience(experience: string): EvaluationExperience {
    const normalized = experience.trim().toLowerCase();
    if (['junior', 'mid', 'senior', 'staff'].includes(normalized)) {
      return normalized as EvaluationExperience;
    }
    return 'mid';
  }

  private sanitizeScore(score: number): number {
    if (!Number.isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private buildRubric(question: string, topic: EvaluationTopic): Rubric {
    const profile = this.mapProfile(topic, undefined);
    return this.buildDefaultRubric(`${topic}-fallback-rubric`, profile, question);
  }

  private extractConcept(question: string): string {
    const normalized = question.toLowerCase();
    if (normalized.includes('cache')) return 'caching';
    if (normalized.includes('rate limit')) return 'rate_limiting';
    if (normalized.includes('session')) return 'session_management';
    if (normalized.includes('database')) return 'data_access';
    return 'architecture';
  }

  private toFinalReport(
    aggregation: ReturnType<SessionAggregatorService['aggregate']>,
    questionResults: SessionQuestionAggregationResult[],
  ): FinishOutput['report'] {
    const strengths = this.buildStrengths(questionResults);
    const weakAreas = this.buildWeakAreas(questionResults, aggregation.repeatedMissingConcepts, aggregation.nonAttemptCount);
    const communicationFeedback = this.buildCommunicationFeedback(aggregation.nonAttemptCount, aggregation.weakAttemptCount);
    const technicalFeedback = this.buildTechnicalFeedback(weakAreas, aggregation.repeatedMissingConcepts);
    const improvementPlan = this.buildImprovementPlan(aggregation.repeatedMissingConcepts, aggregation.studyPlan);
    const skillBreakdown = this.buildSkillBreakdown(aggregation.conceptPerformance);

    return {
      overallScore: aggregation.overallScore,
      strengths,
      weakAreas,
      communicationFeedback,
      technicalFeedback,
      improvementPlan,
      skillBreakdown,
      learningResources: this.buildLearningResources(aggregation.repeatedMissingConcepts),
    };
  }

  private buildStrengths(questionResults: SessionQuestionAggregationResult[]): string[] {
    const candidates = questionResults
      .map((result, index) => ({
        index,
        score: result.score,
        status: result.attemptGate.status,
        concept: result.concept ?? 'general',
      }))
      .filter((item) => item.status === 'valid_attempt' && item.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => `Q${item.index + 1} (${item.concept}) showed the strongest coverage (${item.score}/100).`);

    if (candidates.length > 0) {
      return candidates;
    }

    return ['No strong answers detected. Provide a complete, technical attempt for each question.'];
  }

  private buildWeakAreas(
    questionResults: SessionQuestionAggregationResult[],
    repeatedMissingConcepts: string[],
    nonAttemptCount: number,
  ): string[] {
    const items: string[] = [];

    if (nonAttemptCount > 0) {
      items.push(`${nonAttemptCount} answers were non-attempts (blank, copied, or gibberish).`);
    }

    const weakest = [...questionResults]
      .map((result, index) => ({ index, score: result.score, missing: result.feedback.missingConcepts }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((item) => `Q${item.index + 1} missed: ${item.missing[0] ?? 'core requirements'}.`);

    items.push(...weakest);

    if (repeatedMissingConcepts.length > 0) {
      items.push(`Repeated gaps: ${repeatedMissingConcepts.slice(0, 3).join(', ')}`);
    }

    return items.filter(Boolean).slice(0, 5);
  }

  private buildCommunicationFeedback(nonAttemptCount: number, weakAttemptCount: number): string {
    if (nonAttemptCount > 0) {
      return 'Several answers were blank, copied, or gibberish. Provide a full attempt so communication can be evaluated.';
    }

    if (weakAttemptCount > 0) {
      return 'Some answers lacked structure or topic-specific depth. Organize responses as context, approach, tradeoffs, and risks.';
    }

    return 'Keep structuring answers with clear steps, explicit tradeoffs, and concise language.';
  }

  private buildTechnicalFeedback(weakAreas: string[], repeatedMissing: string[]): string {
    if (weakAreas.length === 0) {
      return 'Solid technical baseline; continue adding quantitative sizing and failure-mode coverage.';
    }

    if (repeatedMissing.length > 0) {
      return `Focus on the missing concepts that appeared repeatedly: ${repeatedMissing.slice(0, 3).join(', ')}.`;
    }

    return weakAreas[0];
  }

  private buildImprovementPlan(repeatedMissing: string[], studyPlan: string[]): string {
    const steps: string[] = [];

    if (repeatedMissing.length > 0) {
      steps.push(`Rehearse answers that explicitly cover: ${repeatedMissing.slice(0, 3).join(', ')}.`);
    }

    steps.push(...studyPlan.slice(0, 2));
    steps.push('Practice 3 timed mock answers with cache invalidation and concurrency tradeoffs this week.');

    return steps.join(' ');
  }

  private buildSkillBreakdown(conceptPerformance: ConceptPerformance[]): Array<{ skill: string; score: number }> {
    return conceptPerformance
      .map((item) => ({
        skill: this.toSkillDisplayName(item.concept),
        score: Math.max(0, Math.min(10, Math.round(item.averageScore / 10))),
      }))
      .slice(0, 5);
  }

  private toSkillDisplayName(concept: string): string {
    const direct = CONCEPT_TO_SKILL[concept];
    if (direct) return direct;

    const normalized = concept.replace(/-/g, '_');
    const normalizedMatch = CONCEPT_TO_SKILL[normalized];
    if (normalizedMatch) return normalizedMatch;

    return concept
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private buildLearningResources(missingConcepts: string[]): Array<{ title: string; url: string }> {
    const RESOURCE_MAP: Record<string, { title: string; url: string }[]> = {
      event_loop: [{ title: 'Node.js Event Loop', url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick' }],
      caching: [{ title: 'Caching Strategies', url: 'https://redis.io/learn/howtos/solutions/caching' }],
      system_design: [{ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }],
      javascript: [{ title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }],
      databases: [{ title: 'Use The Index, Luke', url: 'https://use-the-index-luke.com/' }],
      concurrency: [{ title: 'Node.js Cluster Docs', url: 'https://nodejs.org/api/cluster.html' }],
      queues: [{ title: 'RabbitMQ Tutorials', url: 'https://www.rabbitmq.com/tutorials' }],
      apis: [{ title: 'REST API Design Guide', url: 'https://restfulapi.net/' }],
      default: [{ title: 'Designing Data-Intensive Applications', url: 'https://dataintensive.net/' }],
    };

    const frequency = new Map<string, number>();
    missingConcepts.forEach((concept) => {
      const key = concept;
      frequency.set(key, (frequency.get(key) ?? 0) + 1);
    });

    const rankedConcepts = [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([concept]) => concept);
    const results: { title: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    for (const concept of rankedConcepts) {
      const resources = RESOURCE_MAP[concept] ?? [];
      for (const resource of resources) {
        if (!seenUrls.has(resource.url)) {
          results.push(resource);
          seenUrls.add(resource.url);
        }
      }
      if (results.length >= 4) break;
    }

    if (results.length < 4) {
      for (const resource of RESOURCE_MAP.default) {
        if (!seenUrls.has(resource.url)) {
          results.push(resource);
          seenUrls.add(resource.url);
          if (results.length >= 4) break;
        }
      }
    }

    return results.slice(0, 4);
  }

  private resolveRubric(
    stored: RubricResolutionContext | undefined,
    topic: EvaluationTopic,
    debug: boolean,
  ): { rubric: Rubric; fallbackUsed: boolean; resolvedLevel: 0 | 1 | 2 | 3 } {
    const topicId = this.toTopicId(stored?.topicId, topic);
    const pack = topicId ? getTopicPack(topicId) : undefined;
    const profile = this.mapProfile(topic, stored?.archetype);
    const logDebug = process.env.INTERVIEW_DEBUG === 'true';

    const lookupTemplate = (id?: string): Rubric | null => {
      if (!id) return null;
      const seed = this.seedRubricById(id, profile);
      if (seed) return seed;
      const withinPack = pack?.rubricTemplates.find((r) => r.id === id);
      if (withinPack) return this.fromTemplate(withinPack, topic, stored?.archetype);

      // fallback: search all packs for a matching rubric id
      for (const candidate of Object.values(topicPacks)) {
        const template = candidate.rubricTemplates.find((r) => r.id === id);
        if (template) {
          return this.fromTemplate(template, topic, stored?.archetype);
        }
      }
      return null;
    };

    let resolvedLevel: 0 | 1 | 2 | 3 = 3;
    let fallbackUsed = false;
    let rubric: Rubric | null = null;

    // priority 0: stored rubricId direct lookup
    rubric = lookupTemplate(stored?.rubricId);
    if (rubric) {
      resolvedLevel = 0;
    }

    // priority 1: familyKey -> family default rubric
    if (!rubric && stored?.familyKey && stored?.subtopic) {
      const compositeId = `${stored.familyKey}-${stored.subtopic}`;
      rubric = lookupTemplate(compositeId);
      if (rubric && this.hasRubricContent(rubric)) {
        resolvedLevel = 1;
      } else {
        rubric = null;
      }
    }

    // priority 1b: familyKey -> family default rubric
    if (!rubric && pack && stored?.familyKey) {
      const family = pack.questionFamilies.find((f) => f.key === stored.familyKey);
      if (family?.defaultRubricId) {
        rubric = lookupTemplate(family.defaultRubricId);
        if (rubric && this.hasRubricContent(rubric)) {
          resolvedLevel = 1;
        } else {
          rubric = null;
        }
      }
    }

    // priority 2: subtopic -> first family that references subtopic in concepts/supporting
    if (!rubric && pack && stored?.subtopic) {
      const subtopic = stored.subtopic;
      const family = pack.questionFamilies.find(
        (f) => f.primaryConcepts?.includes(subtopic) || f.supportingConcepts?.includes(subtopic),
      );
      if (family?.defaultRubricId) {
        rubric = lookupTemplate(family.defaultRubricId);
        if (rubric && this.hasRubricContent(rubric)) {
          resolvedLevel = 2;
        } else {
          rubric = null;
        }
      }
    }

    // priority 3: topic-level generic fallback
    if (!rubric) {
      fallbackUsed = true;
      rubric = this.buildDefaultRubric(`${topic}-fallback-rubric`, profile, stored?.renderedQuestion);
      resolvedLevel = 3;
    }

    rubric.profile = rubric.profile ?? profile;

    if (fallbackUsed) {
      this.logger.warn(
        `[Rubric] FALLBACK_USED questionId=${stored?.questionId ?? 'unknown'} rubricId=${stored?.rubricId ?? 'none'} familyKey=${stored?.familyKey ?? 'none'} resolvedLevel=${resolvedLevel}`,
      );
    }

    if (logDebug) {
      // eslint-disable-next-line no-console
      console.log(
        '[Rubric]',
        `questionId=${stored?.questionId ?? 'unknown'} rubricId=${stored?.rubricId ?? 'n/a'} familyKey=${stored?.familyKey ?? 'n/a'} subtopic=${stored?.subtopic ?? 'n/a'} resolvedLevel=${resolvedLevel} resolvedRubricId=${rubric.id} profile=${rubric.profile} fallbackUsed=${fallbackUsed}`,
      );
    }

    return { rubric, fallbackUsed, resolvedLevel };
  }

  private mapProfile(topic: EvaluationTopic, archetype?: string): ScoreProfileId {
    let profile: ScoreProfileId;

    if (archetype === 'debugging') {
      profile = 'debugging';
    } else if (archetype === 'scenario') {
      profile = 'scenario';
    } else {
      switch (topic) {
        case 'javascript':
        case 'nodejs':
          profile = 'fundamentals';
          break;
        case 'system_design':
        case 'caching':
        case 'databases':
        case 'queues':
        case 'apis':
        case 'concurrency':
          profile = 'system_design';
          break;
        case 'debugging':
          profile = 'debugging';
          break;
        case 'generic':
        default:
          profile = 'fundamentals';
          break;
      }
    }

    if (!Object.prototype.hasOwnProperty.call(SCORE_PROFILE_WEIGHTS, profile)) {
      throw new Error(`INVALID_PROFILE_MAPPING: ${topic} → ${profile}`);
    }

    return profile;
  }

  private toTopicId(storedTopicId: string | undefined, topic: EvaluationTopic): TopicId | null {
    if (storedTopicId && this.isTopicId(storedTopicId)) return storedTopicId;
    if (topic === 'system_design') return 'system-design';
    if (topic === 'javascript') return 'javascript';
    if (topic === 'nodejs') return 'nodejs';
    return null;
  }

  private isTopicId(value: string): value is TopicId {
    return (
      [
        'system-design',
        'databases',
        'caching',
        'queues',
        'apis',
        'concurrency',
        'javascript',
        'nodejs',
      ] as string[]
    ).includes(value);
  }

  private seedRubricById(id: string, fallbackProfile: ScoreProfileId): Rubric | null {
    const combined = [...javascriptRubrics, ...nodeJsRubrics];
    const found = combined.find((item) => item.id === id);
    if (!found) return null;
    return {
      id: found.id,
      profile: fallbackProfile,
      mustHave: found.mustHave,
      niceToHave: found.niceToHave,
      validStrategies: found.validStrategies,
      redFlags: found.redFlags,
      scoringWeights: found.scoringWeights,
    };
  }

  private fromTemplate(template: RubricTemplate, topic: EvaluationTopic, archetype?: string): Rubric {
    return {
      id: template.id,
      profile: this.mapProfile(topic, archetype ?? template.archetype),
      mustHave: template.mustHave,
      niceToHave: template.niceToHave,
      validStrategies: [],
      redFlags: template.redFlags,
      scoringWeights: this.buildWeightsForProfile(this.mapProfile(topic, archetype ?? template.archetype)),
    };
  }

  private buildDefaultRubric(id: string, profile: ScoreProfileId, question?: string): Rubric {
    const normalizedQuestion = (question ?? '').toLowerCase();
    const mustHave = [
      'State the main requirement clearly',
      'Describe the steps or architecture to solve it',
      'Handle errors/failures and edge cases',
      'Explain why the approach fits the scenario',
    ];
    if (normalizedQuestion.includes('rate limit')) {
      mustHave.unshift('Choose and justify a rate limiting algorithm');
    }
    if (normalizedQuestion.includes('cache')) {
      mustHave.unshift('Describe cache keys, TTL/eviction, and consistency');
    }

    return {
      id,
      profile,
      mustHave,
      niceToHave: ['Quantify performance impact', 'Reference tooling or instrumentation'],
      validStrategies: ['Provide a concrete example with data flow or code'],
      redFlags: ['Hand-wavy answer', 'Ignores failure modes'],
      scoringWeights: this.buildWeightsForProfile(profile),
    };
  }

  private buildMustHaves(stored: StoredQuestionPlanItem | undefined, topic: EvaluationTopic): string[] {
    const conceptList = stored?.concepts ?? [];
    if (conceptList.length > 0) {
      return [
        `Cover core concept(s): ${conceptList.join(', ')}`,
        'Provide a concrete example tied to the scenario',
        'Address errors/failures and mitigation',
        'Explain performance or complexity considerations',
      ];
    }

    if (topic === 'system_design') {
      return [
        'Describe the core components and data flow',
        'Explain cache/throughput limits and bottlenecks',
        'Handle concurrency and race conditions safely',
        'Cover failure handling and fallback behavior',
      ];
    }

    return [
      'State the main concept clearly',
      'Show how it works with a short code or flow example',
      'Call out common pitfalls and how to avoid them',
      'Mention how to validate or test the solution',
    ];
  }

  private buildWeightsForProfile(profile: ScoreProfileId) {
    const weights = SCORE_PROFILE_WEIGHTS[profile];
    if (!weights) {
      throw new Error(`INVALID_PROFILE_MAPPING: unknown profile weights for ${profile}`);
    }
    return weights;
  }

  private hasRubricContent(rubric: Rubric): boolean {
    return Array.isArray(rubric.mustHave) && rubric.mustHave.length > 0 && Array.isArray(rubric.redFlags);
  }
}
