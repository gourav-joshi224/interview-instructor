import { Injectable, Logger } from '@nestjs/common';
import { PlannedQuestion, QuestionSelectionOptions, normalizeDifficulty, planQuestionsFromPack } from './question-selection.util';
import { QuestionRendererService, QuestionValidatorService } from '../index';
import { getTopicPack } from '../topic-pack.registry';
import { ConstraintTemplate, QuestionFamily, ScenarioHook, TopicId, TopicPack } from '../topic-pack.types';
import { GeneratedQuestionInstance } from './question-instance.types';

interface AssemblyInput {
  topicId: TopicId;
  difficulty: string;
  experience: string;
  totalQuestions: number;
  excludeQuestionIds?: string[];
  selectionOptions?: QuestionSelectionOptions;
}

export interface AssemblyResult {
  questions: GeneratedQuestionInstance[];
  deficit: number;
}

const MAX_PER_ARCHETYPE = parseInt(process.env.MAX_PER_ARCHETYPE ?? '3', 10);
const WARM_UP_PRODUCTION_INCIDENT_PATTERN =
  /\b(out-of-memory|oom|pods|heap|incident|outage|production issue|p99|latency spike|kills|crashes)\b/i;

@Injectable()
export class QuestionAssemblyService {
  private readonly logger = new Logger(QuestionAssemblyService.name);

  constructor(
    private readonly renderer: QuestionRendererService,
    private readonly validator: QuestionValidatorService,
  ) {}

  assemble(input: AssemblyInput): AssemblyResult {
    const excludeSet = new Set(input.excludeQuestionIds ?? []);
    const pack = getTopicPack(input.topicId);
    const planned: PlannedQuestion[] = planQuestionsFromPack(
      pack,
      input.totalQuestions,
      Number.isNaN(MAX_PER_ARCHETYPE) ? 3 : MAX_PER_ARCHETYPE,
      {
        ...input.selectionOptions,
        excludeQuestionIds: input.excludeQuestionIds,
        difficulty: input.difficulty,
      },
    );

    const usedQuestions: string[] = [...(input.selectionOptions?.excludeQuestionTexts ?? [])];
    const usedFamilyKeys: string[] = [];
    const usedSkeletons: string[] = [];
    const usedHookIds: string[] = [];
    const usedNumericScales: string[] = [];
    const instances: GeneratedQuestionInstance[] = [];

    for (const item of planned) {
      const rendered = this.renderer.render({
        topicId: input.topicId,
        familyKey: item.family.key,
        hookId: item.hook.id,
        constraintIds: item.constraints.map((c) => c.id),
      });

      const validation = this.validator.validate(rendered, {
        askedQuestions: usedQuestions,
        usedFamilyKeys,
        usedSkeletons,
        usedHookIds,
        availableHookCount: pack.scenarioHooks.length,
        usedNumericScales,
      });

      if (!validation.valid) {
        const retry = this.tryAlternateHook(pack, item.family, usedHookIds);
        if (retry && !excludeSet.has(`${item.family.key}::${retry.id}`)) {
          const reRendered = this.renderer.render({
            topicId: input.topicId,
            familyKey: item.family.key,
            hookId: retry.id,
            constraintIds: item.constraints.map((c) => c.id),
          });
          const retryValidation = this.validator.validate(reRendered, {
            askedQuestions: usedQuestions,
            usedFamilyKeys,
            usedSkeletons,
            usedHookIds,
            availableHookCount: pack.scenarioHooks.length,
            usedNumericScales,
          });
          if (!retryValidation.valid) {
            this.logger.warn(`Validator rejected question after retry: ${retryValidation.reasons.join(', ')}`);
          } else {
            instances.push(this.toInstance(reRendered, item.family, item.constraints, retry));
            this.track(
              reRendered,
              usedQuestions,
              usedFamilyKeys,
              usedSkeletons,
              usedHookIds,
              usedNumericScales,
              item.family.key,
              retry.id,
            );
            continue;
          }
        }

        const alternateFamily = this.tryAlternateFamily(pack, item.hook, usedFamilyKeys);
        if (alternateFamily && !excludeSet.has(`${alternateFamily.key}::${item.hook.id}`)) {
          const altConstraints = (alternateFamily.defaultConstraints ?? [])
            .map((id) => pack.constraintTemplates.find((c) => c.id === id))
            .filter((c): c is ConstraintTemplate => Boolean(c));
          const reRendered = this.renderer.render({
            topicId: input.topicId,
            familyKey: alternateFamily.key,
            hookId: item.hook.id,
            constraintIds: altConstraints.map((c) => c.id),
          });
          const altValidation = this.validator.validate(reRendered, {
            askedQuestions: usedQuestions,
            usedFamilyKeys,
            usedSkeletons,
            usedHookIds,
            availableHookCount: pack.scenarioHooks.length,
            usedNumericScales,
          });
          if (altValidation.valid) {
            instances.push(this.toInstance(reRendered, alternateFamily, altConstraints, item.hook));
            this.track(
              reRendered,
              usedQuestions,
              usedFamilyKeys,
              usedSkeletons,
              usedHookIds,
              usedNumericScales,
              alternateFamily.key,
              item.hook.id,
            );
            continue;
          }
        }

        this.logger.warn(`Validator rejected question: ${validation.reasons.join(', ')}`);
        continue;
      }

      instances.push(this.toInstance(rendered, item.family, item.constraints, item.hook));
      this.track(
        rendered,
        usedQuestions,
        usedFamilyKeys,
        usedSkeletons,
        usedHookIds,
        usedNumericScales,
        item.family.key,
        item.hook.id,
      );
    }

    if (instances.length < input.totalQuestions) {
      this.backfillMissingSlots(
        pack,
        input.topicId,
        input.totalQuestions - instances.length,
        input.difficulty,
        {
          usedQuestions,
          usedFamilyKeys,
          usedSkeletons,
          usedHookIds,
          usedNumericScales,
          instances,
          excludeSet,
        },
      );
    }

    const questions = instances.slice(0, input.totalQuestions);
    const deficit = Math.max(0, input.totalQuestions - questions.length);

    if (deficit > 0) {
      this.logger.warn(
        `[Assembly] BACKFILL_INCOMPLETE: requested=${input.totalQuestions} generated=${questions.length} topic=${input.topicId}`,
      );
    }

    return { questions, deficit };
  }

  private backfillMissingSlots(
    pack: TopicPack,
    topicId: TopicId,
    deficit: number,
    difficulty: string,
    state: {
      usedQuestions: string[];
      usedFamilyKeys: string[];
      usedSkeletons: string[];
      usedHookIds: string[];
      usedNumericScales: string[];
      instances: GeneratedQuestionInstance[];
      excludeSet: Set<string>;
    },
  ) {
    if (deficit <= 0) return;

    const targetCount = state.instances.length + deficit;
    const difficultyKey = normalizeDifficulty(difficulty);
    const hooks = this.shuffle(pack.scenarioHooks);

    if (hooks.length === 0 || pack.questionFamilies.length === 0) return;

    const constraintsById = new Map(pack.constraintTemplates.map((c) => [c.id, c]));
    const backfillPools = this.buildBackfillFamilyPools(pack.questionFamilies, difficultyKey);

    for (const families of backfillPools) {
      for (const family of families) {
        if (state.instances.length >= targetCount) {
          break;
        }

        const hook = this.pickCompatibleHook(hooks, family, state.usedHookIds, difficultyKey, state.excludeSet);
        if (!hook) {
          continue;
        }

        const constraints = (family.defaultConstraints ?? [])
          .map((id) => constraintsById.get(id))
          .filter((c): c is ConstraintTemplate => Boolean(c));

        const rendered = this.renderer.render({
          topicId,
          familyKey: family.key,
          hookId: hook.id,
          constraintIds: constraints.map((c) => c.id),
        });

        const validation = this.validator.validate(rendered, {
          askedQuestions: state.usedQuestions,
          usedFamilyKeys: state.usedFamilyKeys,
          usedSkeletons: state.usedSkeletons,
          usedHookIds: state.usedHookIds,
          availableHookCount: pack.scenarioHooks.length,
          usedNumericScales: state.usedNumericScales,
        });

        if (!this.isBackfillValid(validation.reasons)) {
          continue;
        }

        state.instances.push(this.toInstance(rendered, family, constraints, hook));
        this.track(
          rendered,
          state.usedQuestions,
          state.usedFamilyKeys,
          state.usedSkeletons,
          state.usedHookIds,
          state.usedNumericScales,
          family.key,
          hook.id,
        );

        if (state.instances.length >= targetCount) {
          break;
        }
      }

      if (state.instances.length >= targetCount) {
        break;
      }
    }
  }

  private isBackfillValid(reasons: string[]): boolean {
    return reasons.length === 0;
  }

  private buildBackfillFamilyPools(
    families: QuestionFamily[],
    difficulty: QuestionFamily['difficulty'] | null,
  ): QuestionFamily[][] {
    if (!difficulty) {
      return [this.shuffle(families)];
    }

    const exactFamilies = families.filter((family) => !family.difficulty || family.difficulty === difficulty);
    const fallbackDifficulties = this.getAdjacentBackfillDifficulties(difficulty);
    const fallbackFamilies = families.filter(
      (family) =>
        Boolean(family.difficulty) &&
        fallbackDifficulties.includes(family.difficulty) &&
        !exactFamilies.some((candidate) => candidate.key === family.key),
    );

    const pools: QuestionFamily[][] = [];

    if (exactFamilies.length > 0) {
      pools.push(this.shuffle(exactFamilies));
    }

    if (fallbackFamilies.length > 0) {
      pools.push(this.shuffle(fallbackFamilies));
    }

    return pools.length > 0 ? pools : [this.shuffle(families)];
  }

  private getAdjacentBackfillDifficulties(
    difficulty: QuestionFamily['difficulty'],
  ): QuestionFamily['difficulty'][] {
    switch (difficulty) {
      case 'warm_up':
        return ['medium'];
      case 'medium':
        return ['warm_up', 'hard'];
      case 'hard':
        return ['medium', 'epic'];
      case 'epic':
        return ['hard'];
      default:
        return [];
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private tryAlternateHook(pack: TopicPack, family: QuestionFamily, usedHookIds: string[]): ScenarioHook | undefined {
    return pack.scenarioHooks.find(
      (hook) => !usedHookIds.includes(hook.id) && this.isHookCompatibleWithFamily(hook, family),
    );
  }

  private tryAlternateFamily(pack: TopicPack, hook: ScenarioHook, usedFamilyKeys: string[]): QuestionFamily | undefined {
    return pack.questionFamilies.find(
      (family) => !usedFamilyKeys.includes(family.key) && this.isHookCompatibleWithFamily(hook, family),
    );
  }

  private pickCompatibleHook(
    hooks: ScenarioHook[],
    family: QuestionFamily,
    usedHookIds: string[],
    difficulty?: QuestionFamily['difficulty'] | null,
    excludeSet: Set<string> = new Set(),
  ): ScenarioHook | undefined {
    const excludeProductionIncidentHooks =
      difficulty === 'warm_up' || family.difficulty === 'warm_up';
    const compatible = hooks.filter(
      (hook) =>
        !usedHookIds.includes(hook.id) &&
        !excludeSet.has(`${family.key}::${hook.id}`) &&
        this.isHookCompatibleWithFamily(hook, family),
    );
    const warmUpSafeCompatible =
      excludeProductionIncidentHooks
        ? compatible.filter(
            (hook) =>
              !WARM_UP_PRODUCTION_INCIDENT_PATTERN.test(`${hook.backdrop ?? ''} ${hook.trigger ?? ''}`),
          )
        : compatible;

    const fallbackHooks = hooks.filter(
      (hook) =>
        !usedHookIds.includes(hook.id) &&
        !excludeSet.has(`${family.key}::${hook.id}`) &&
        (!excludeProductionIncidentHooks ||
          !WARM_UP_PRODUCTION_INCIDENT_PATTERN.test(`${hook.backdrop ?? ''} ${hook.trigger ?? ''}`)),
    );

    return warmUpSafeCompatible[0] ?? compatible[0] ?? fallbackHooks[0];
  }

  private isHookCompatibleWithFamily(hook: ScenarioHook, family: QuestionFamily): boolean {
    return !hook.compatibleFamilies?.length || hook.compatibleFamilies.includes(family.key);
  }

  private toInstance(
    rendered: ReturnType<QuestionRendererService['render']>,
    family: QuestionFamily,
    constraints: ConstraintTemplate[],
    hook: ScenarioHook,
  ): GeneratedQuestionInstance {
    return {
      questionId: `${family.key}::${hook.id}`,
      topicId: rendered.topicId,
      familyKey: family.key,
      archetype: family.archetype,
      hookId: hook.id,
      concepts: family.primaryConcepts ?? [],
      subtopic: family.primaryConcepts?.[0] ?? family.key,
      rubricId: family.defaultRubricId,
      constraintSnapshot: constraints.map((c) => ({ id: c.id, label: c.label, text: c.text })),
      rendered,
      hook,
      family,
    };
  }

  private track(
    rendered: ReturnType<QuestionRendererService['render']>,
    usedQuestions: string[],
    usedFamilyKeys: string[],
    usedSkeletons: string[],
    usedHookIds: string[],
    usedNumericScales: string[],
    familyKey: string,
    hookId: string,
  ) {
    usedQuestions.push(rendered.text);
    usedFamilyKeys.push(familyKey);
    usedSkeletons.push(rendered.skeleton);
    usedHookIds.push(hookId);
    const numeric = this.validator.extractNumericScale(rendered.text);
    if (numeric) {
      usedNumericScales.push(numeric);
    }
  }
}
