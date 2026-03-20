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
    const conceptTitles = family.primaryConcepts
      .map((conceptId) => pack.concepts.find((c) => c.id === conceptId)?.title)
      .filter((title): title is string => Boolean(title));

    const scenarioLine = this.buildScenarioLine(hook);
    const primaryAsk = this.buildPrimaryAsk(family, hook, conceptTitles);
    const constraintLine = this.buildConstraintLine(constraints);

    const raw = [scenarioLine, primaryAsk, constraintLine].filter(Boolean).join(' ');

    return finalizeQuestionText(raw);
  }

  private buildScenarioLine(hook: ScenarioHook): string {
    const core = [hook.backdrop, hook.trigger].filter(Boolean).join(' ').trim();
    return core ? `${hook.title}: ${core}` : hook.title;
  }

  private buildPrimaryAsk(family: QuestionFamily, hook: ScenarioHook, conceptTitles: string[]): string {
    const concept = conceptTitles[0] ?? family.primaryConcepts?.[0] ?? 'the concept';

    switch (family.key) {
      case 'javascript.event_loop':
        return `How would event loop and microtask ordering guide your fix here?`;
      case 'javascript.promises_async':
        return `How would you sequence the async work and handle errors without starving rendering?`;
      case 'javascript.closures':
        return `Why is state sticking around and how would you release the captured references?`;
      case 'javascript.scope_chain':
        return `Trace which identifiers resolve where in this case and explain why.`;
      case 'javascript.hoisting':
        return `Walk through the hoisting/TDZ issue you see and show the safer rewrite.`;
      case 'javascript.prototype_chain':
        return `Trace the prototype chain involved here and propose a safer creation pattern.`;
      case 'javascript.this_binding':
        return `How would you fix the this-binding bug and prevent it in similar code?`;
      case 'javascript.memory_leaks':
        return `How would you surface and stop the leak (detached DOM, listeners, closures)?`;
      default:
        return `How would you apply ${concept} to resolve this?`;
    }
  }

  private buildConstraintLine(constraints: ConstraintTemplate[]): string {
    if (!constraints.length) return '';
    const limited = constraints.slice(0, 2);
    const text = limited.map((c) => c.text).join('; ');
    return text ? `Constraint: ${text}.` : '';
  }
}
