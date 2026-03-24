import { Injectable } from '@nestjs/common';
import {
  ConstraintTemplate,
  QuestionFamily,
  RenderedQuestion,
  ScenarioHook,
  TopicId,
  TopicPack,
} from '../topic-pack.types';
import { getTopicPack } from '../topic-pack.registry';
import { finalizeQuestionText } from './question-finalizer.util';

interface RenderInput {
  topicId: TopicId;
  familyKey?: string;
  hookId?: string;
  constraintIds?: string[];
  packOverride?: TopicPack;
}

@Injectable()
export class QuestionRendererService {
  render(input: RenderInput): RenderedQuestion {
    const pack = input.packOverride ?? getTopicPack(input.topicId);
    const family = this.pickFamily(pack, input.familyKey);
    const hook = this.pickHook(pack, input.hookId);
    const constraints = this.pickConstraints(pack, input.constraintIds ?? family.defaultConstraints ?? []);

    const text = this.composeQuestion(pack, family, hook, constraints);

    return {
      topicId: pack.topicId,
      familyKey: family.key,
      hookId: hook.id,
      constraintIds: constraints.map((c) => c.id),
      skeleton: family.phrasingSkeleton,
      text,
    };
  }

  private pickFamily(pack: TopicPack, familyKey?: string): QuestionFamily {
    const family = familyKey ? pack.questionFamilies.find((f) => f.key === familyKey) : pack.questionFamilies[0];
    if (!family) {
      throw new Error(`No question family found for topic ${pack.topicId}`);
    }
    return family;
  }

  private pickHook(pack: TopicPack, hookId?: string): ScenarioHook {
    const hook = hookId ? pack.scenarioHooks.find((h) => h.id === hookId) : pack.scenarioHooks[0];
    if (!hook) {
      throw new Error(`No scenario hook found for topic ${pack.topicId}`);
    }
    return hook;
  }

  private pickConstraints(pack: TopicPack, ids: string[]): ConstraintTemplate[] {
    if (!ids.length) return [];
    const table = new Map(pack.constraintTemplates.map((c) => [c.id, c]));
    return ids.map((id) => table.get(id)).filter((c): c is ConstraintTemplate => Boolean(c));
  }

  private composeQuestion(
    pack: TopicPack,
    family: QuestionFamily,
    hook: ScenarioHook,
    constraints: ConstraintTemplate[],
  ): string {
    const scenarioLine = family.difficulty === 'warm_up' ? '' : this.buildScenarioLine(hook);
    const primaryAsk = this.buildPrimaryAsk(family, hook);
    const constraintLine = family.difficulty === 'warm_up' ? '' : this.buildConstraintLine(constraints);

    const raw = [scenarioLine, primaryAsk, constraintLine].filter(Boolean).join(' ');

    return finalizeQuestionText(raw);
  }

  private buildScenarioLine(hook: ScenarioHook): string {
    return [hook.backdrop, hook.trigger].filter(Boolean).join(' ').trim();
  }

  private buildPrimaryAsk(family: QuestionFamily, hook: ScenarioHook): string {
    const skeletons = family.phrasingSkeleton
      .split(' / ')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skeletons.length <= 1) return skeletons[0] ?? family.stem;
    if (family.difficulty !== 'warm_up') return skeletons[0];

    const index = Math.abs(
      hook.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0),
    ) % skeletons.length;

    return skeletons[index];
  }

  private buildConstraintLine(constraints: ConstraintTemplate[]): string {
    if (!constraints.length) return '';
    const limited = constraints.slice(0, 2);
    const text = limited.map((c) => c.text).join('; ');
    return text ? `Constraint: ${text}.` : '';
  }
}
