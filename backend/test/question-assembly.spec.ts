import assert from 'node:assert/strict';
import test from 'node:test';

import { QuestionRendererService, QuestionValidatorService } from '../src/modules/interview-brain/content';
import { QuestionAssemblyService } from '../src/modules/interview-brain/content/runtime/question-assembly.service';
import { PlannerService } from '../src/modules/interview-brain/planner/planner.service';
import { MasteryFilterService } from '../src/modules/interview-brain/planner/mastery-filter.service';
import { HistoryFilterService } from '../src/modules/interview-brain/planner/history-filter.service';
import { RulesService } from '../src/modules/interview-brain/planner/rules.service';
import { TopicPack } from '../src/modules/interview-brain/content';
import { PlannedQuestion } from '../src/modules/interview-brain/content/runtime/question-selection.util';

const buildAssembly = () => {
  const rules = new RulesService();
  const mastery = new MasteryFilterService();
  const history = new HistoryFilterService();
  const planner = new PlannerService(rules, mastery, history);
  const renderer = new QuestionRendererService();
  const validator = new QuestionValidatorService();
  const assembly = new QuestionAssemblyService(planner, renderer, validator);
  return { assembly, validator };
};

test('system design session enforces diversity and uniqueness', () => {
  const { assembly } = buildAssembly();
  const instances = assembly.assemble({
    topicId: 'system-design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 10,
  });

  const familyKeys = new Set(instances.map((i) => i.familyKey));
  const questions = new Set(instances.map((i) => i.rendered.text));
  const archetypeCounts = instances.reduce<Record<string, number>>((acc, item) => {
    acc[item.archetype] = (acc[item.archetype] ?? 0) + 1;
    return acc;
  }, {});

  assert.equal(instances.length, 10);
  assert.equal(familyKeys.size, instances.length); // no repeated familyKey
  assert.equal(questions.size, instances.length); // no duplicate question text
  Object.values(archetypeCounts).forEach((count) => assert.ok(count <= 3));
  assert.ok(new Set(instances.map((i) => i.subtopic)).size >= 4); // broad subtopic spread
});

test('renderer does not repeat 10,000 concurrent users phrase across session', () => {
  const { assembly, validator } = buildAssembly();
  const instances = assembly.assemble({
    topicId: 'system-design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 6,
  });

  const repeated = instances.filter((i) => validator.containsTenThousandUsers(i.rendered.text));
  assert.ok(repeated.length <= 1);
});

test('assembly retries when validator rejects duplicate', () => {
  // Fake planner returns the same family twice to force validator rejection; assembly should still return >0 questions.
  class FakePlanner extends PlannerService {
    constructor() {
      super(new RulesService(), new MasteryFilterService(), new HistoryFilterService());
    }
    planFromTopicPack(pack: TopicPack, total: number): PlannedQuestion[] {
      const family = pack.questionFamilies[0];
      const hook = pack.scenarioHooks[0];
      const constraints = (family.defaultConstraints ?? []).map((id) =>
        pack.constraintTemplates.find((c) => c.id === id)!,
      );
      return Array.from({ length: total }, () => ({ family, hook, constraints }));
    }
  }

  const planner = new FakePlanner();
  const renderer = new QuestionRendererService();
  const validator = new QuestionValidatorService();
  const assembly = new QuestionAssemblyService(planner, renderer, validator);

  const instances = assembly.assemble({
    topicId: 'system-design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 3,
  });

  // Should still produce at least one valid question after retry.
  assert.ok(instances.length >= 1);
});

test('generated instances preserve metadata', () => {
  const { assembly } = buildAssembly();
  const [first] = assembly.assemble({
    topicId: 'system-design',
    difficulty: 'medium',
    experience: 'mid',
    totalQuestions: 1,
  });

  assert.ok(first.questionId);
  assert.ok(first.familyKey);
  assert.ok(first.archetype);
  assert.ok(first.hookId);
  assert.ok(first.concepts.length > 0);
  assert.ok(first.rendered.text.length > 0);
  assert.ok(first.constraintSnapshot.length >= 0);
});
