import { Injectable } from '@nestjs/common';
import { Difficulty, ExperienceBand, InterviewSessionPlan, QuestionTemplate, Topic, UserConceptMastery } from '../domain';
import { TopicPack, ConstraintTemplate, QuestionFamily, ScenarioHook } from '../content';
import { PlannedQuestion, planQuestionsFromPack } from '../content/runtime/question-selection.util';
import { HistoryFilterService } from './history-filter.service';
import { MasteryFilterService } from './mastery-filter.service';
import { RulesService } from './rules.service';

export interface PlannerInput {
  sessionId: string;
  userId: string;
  topic: Topic;
  difficulty: Difficulty;
  experience: ExperienceBand;
  totalQuestions: number;
  questionTemplates: QuestionTemplate[];
  userMastery: UserConceptMastery[];
  recentSessionQuestionIds: string[];
}

/**
 * Interview session planner: selects a balanced, deterministic set of questions
 * before the interview begins. The service is pure and side‑effect free so it
 * can be unit tested without extra wiring.
 */
@Injectable()
export class PlannerService {
  constructor(
    private readonly rulesService: RulesService,
    private readonly masteryFilter: MasteryFilterService,
    private readonly historyFilter: HistoryFilterService,
  ) {}

  planFromTopicPack(pack: TopicPack, total: number): PlannedQuestion[] {
    return planQuestionsFromPack(pack, total);
  }

  planSession(input: PlannerInput): InterviewSessionPlan {
    const filteredByProfile = this.filterByProfile(
      input.questionTemplates,
      input.topic,
      input.difficulty,
      input.experience,
    );

    const { preferred: masteryPreferred, fallback: masteredFallback } = this.masteryFilter.partitionByMastery(
      filteredByProfile,
      input.userMastery,
    );

    const {
      preferred: historyPreferred,
      fallback: historyFallback,
    } = this.historyFilter.partitionByHistory(masteryPreferred, input.recentSessionQuestionIds);

    // Primary selection avoids mastered concepts and recent questions.
    const primaryPool = historyPreferred;

    // Fallback pool reintroduces history + mastery exclusions in a deterministic order.
    const fallbackPool = this.buildFallbackPool(historyFallback, masteredFallback, primaryPool);

    const plannedTemplates = this.pickQuestions(primaryPool, fallbackPool, input.totalQuestions);
    const targetedConcepts = this.rulesService.collectConcepts(plannedTemplates);

    return {
      sessionId: input.sessionId,
      userId: input.userId,
      topic: input.topic,
      difficulty: input.difficulty,
      experience: input.experience,
      totalQuestions: input.totalQuestions,
      plannedQuestionIds: plannedTemplates.map((q) => q.id),
      askedQuestionIds: [],
      targetedConcepts,
      status: 'planned',
    };
  }

  private filterByProfile(
    templates: QuestionTemplate[],
    topic: Topic,
    difficulty: Difficulty,
    experience: ExperienceBand,
  ): QuestionTemplate[] {
    return templates.filter(
      (template) =>
        template.topic === topic &&
        template.difficulty === difficulty &&
        template.experienceBands.includes(experience),
    );
  }

  private buildFallbackPool(
    historyFallback: QuestionTemplate[],
    masteryFallback: QuestionTemplate[],
    primaryPool: QuestionTemplate[],
  ): QuestionTemplate[] {
    const seen = new Set(primaryPool.map((t) => t.id));
    const combined: QuestionTemplate[] = [];

    const pushUnique = (template: QuestionTemplate) => {
      if (!seen.has(template.id)) {
        combined.push(template);
        seen.add(template.id);
      }
    };

    // Prefer previously unseen history items, then mastered items.
    for (const template of historyFallback) pushUnique(template);
    for (const template of masteryFallback) pushUnique(template);

    return combined;
  }

  private pickQuestions(
    primaryPool: QuestionTemplate[],
    fallbackPool: QuestionTemplate[],
    totalQuestions: number,
  ): QuestionTemplate[] {
    const primarySelection = this.rulesService.selectWithDiversity(primaryPool, totalQuestions);

    if (primarySelection.length >= totalQuestions) {
      return primarySelection;
    }

    // If we could not fill the session, relax constraints with the fallback pool.
    const remaining = totalQuestions - primarySelection.length;
    const fallbackSelection = this.rulesService.selectWithDiversity(fallbackPool, remaining);

    return [...primarySelection, ...fallbackSelection].slice(0, totalQuestions);
  }
}
