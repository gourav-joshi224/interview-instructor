import { planQuestionsFromPack, shuffleArray } from './question-selection.util';
import { TopicPack } from '../topic-pack.types';

const basePack: TopicPack = {
  topicId: 'test',
  label: 'Test',
  description: 'Test pack',
  archetypes: ['a'],
  concepts: [],
  scenarioHooks: [
    { id: 'h1', topicId: 'test', title: 'hook1', backdrop: '', trigger: '', relatedConcepts: [] },
    { id: 'h2', topicId: 'test', title: 'hook2', backdrop: '', trigger: '', relatedConcepts: [] },
  ],
  constraintTemplates: [],
  rubricTemplates: [],
  questionFamilies: [
    {
      key: 'f1',
      topicId: 'test',
      archetype: 'a',
      difficulty: 'warm_up',
      stem: 's',
      framing: 'f',
      primaryConcepts: [],
      defaultConstraints: [],
      defaultRubricId: 'r',
      phrasingSkeleton: '',
    },
    {
      key: 'f2',
      topicId: 'test',
      archetype: 'a',
      difficulty: 'medium',
      stem: 's',
      framing: 'f',
      primaryConcepts: [],
      defaultConstraints: [],
      defaultRubricId: 'r',
      phrasingSkeleton: '',
    },
    {
      key: 'f3',
      topicId: 'test',
      archetype: 'a',
      difficulty: 'hard',
      stem: 's',
      framing: 'f',
      primaryConcepts: [],
      defaultConstraints: [],
      defaultRubricId: 'r',
      phrasingSkeleton: '',
    },
  ],
  learningResources: [],
};

describe('shuffleArray', () => {
  test('does not mutate input', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(original);
    expect(original).toEqual(copy);
  });

  test('returns all elements', () => {
    const result = shuffleArray([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(5);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('produces different order across calls sometimes', () => {
    const results = Array.from({ length: 20 }, () => shuffleArray([1, 2, 3, 4, 5]).join(','));
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('planQuestionsFromPack exclusion options', () => {
  test('excludeFamilyKeys removes those families from selection', () => {
    const planned = planQuestionsFromPack(basePack, 3, 3, { excludeFamilyKeys: ['f1'] });
    expect(planned.some((p) => p.family.key === 'f1')).toBe(false);
  });

  test('empty pool after exclusion falls back to full pool', () => {
    const planned = planQuestionsFromPack(basePack, 2, 3, { excludeFamilyKeys: ['f1', 'f2', 'f3'] });
    expect(planned.length).toBeGreaterThan(0);
  });

  test('no options behaves like baseline and returns requested total', () => {
    const planned = planQuestionsFromPack(basePack, 2);
    expect(planned).toHaveLength(2);
  });

  test('difficulty filter prefers families tagged for that level', () => {
    const planned = planQuestionsFromPack(basePack, 1, 3, { difficulty: 'medium' });
    expect(planned[0]?.family.key).toBe('f2');
  });

  test('easy difficulty normalizes to warm_up families', () => {
    const planned = planQuestionsFromPack(basePack, 1, 3, { difficulty: 'easy' });
    expect(planned[0]?.family.key).toBe('f1');
  });

  test('difficulty filter falls back to all families when no family matches', () => {
    const packWithoutEpic = {
      ...basePack,
      questionFamilies: basePack.questionFamilies.map((family) => ({
        ...family,
        difficulty: family.difficulty === 'hard' ? 'medium' : family.difficulty,
      })),
    };
    const planned = planQuestionsFromPack(packWithoutEpic, 2, 3, { difficulty: 'epic' });
    expect(planned).toHaveLength(2);
  });
});
