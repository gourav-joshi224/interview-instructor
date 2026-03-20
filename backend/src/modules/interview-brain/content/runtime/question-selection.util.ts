import { ConstraintTemplate, QuestionFamily, ScenarioHook, TopicPack } from '../topic-pack.types';

// RC-1 fix: Fisher-Yates shuffle — prevents deterministic first-family bias
// Called per-assembly, not at module load, so each session gets a different order
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; // never mutate original pack data
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface QuestionSelectionOptions {
  excludeFamilyKeys?: string[];
  excludeHookIds?: string[];
  excludeQuestionTexts?: string[];
  difficulty?: string;
}

type SelectionState = {
  usedFamilies: Set<string>;
  archetypeCounts: Map<string, number>;
  maxPerArchetype: number;
  coveredSubtopics: Set<string>;
};

export interface PlannedQuestion {
  family: QuestionFamily;
  hook: ScenarioHook;
  constraints: ConstraintTemplate[];
}

export function planQuestionsFromPack(
  pack: TopicPack,
  total: number,
  maxPerArchetype = 3,
  options?: QuestionSelectionOptions,
): PlannedQuestion[] {
  const state: SelectionState = {
    usedFamilies: new Set(),
    archetypeCounts: new Map(),
    maxPerArchetype,
    coveredSubtopics: new Set(),
  };

  let hooks = shuffleArray([...pack.scenarioHooks]);
  const constraintsById = new Map(pack.constraintTemplates.map((c) => [c.id, c]));

  const planned: PlannedQuestion[] = [];
  const usedHookIds = new Set<string>();

  let families = shuffleArray([...pack.questionFamilies]);

  // RC-2/RC-3 fix: cross-session exclusion list prevents same family/hook appearing in back-to-back sessions
  if (options?.excludeFamilyKeys?.length) {
    families = families.filter((f) => !options.excludeFamilyKeys!.includes(f.key));
  }
  if (options?.excludeHookIds?.length) {
    hooks = hooks.filter((h) => !options.excludeHookIds!.includes(h.id));
  }

  // Safety: if exclusions empty the pool entirely, fall back to full shuffled pool
  if (families.length === 0) {
    families = shuffleArray([...pack.questionFamilies]);
  }
  if (hooks.length === 0) {
    hooks = shuffleArray([...pack.scenarioHooks]);
  }

  // Difficulty filtering: prefer families tagged for this level.
  // Pack coverage may be incomplete, so fall back to all eligible families.
  const difficultyKey = normalizeDifficulty(options?.difficulty);
  const preferredFamilies = difficultyKey
    ? families.filter((family) => !family.difficulty || family.difficulty === difficultyKey)
    : families;
  const activeFamilies = preferredFamilies.length > 0 ? preferredFamilies : families;

  while (planned.length < total && activeFamilies.length > 0) {
    const family = pickNextFamily(activeFamilies, state);
    if (!family) break;

    const hook = pickCompatibleHook(hooks, family, usedHookIds);
    if (!hook) break;
    usedHookIds.add(hook.id);

    const constraints = (family.defaultConstraints ?? [])
      .map((id) => constraintsById.get(id))
      .filter((c): c is ConstraintTemplate => Boolean(c));

    planned.push({ family, hook, constraints });
  }

  return planned;
}

function pickCompatibleHook(
  hooks: ScenarioHook[],
  family: QuestionFamily,
  usedHookIds: Set<string>,
): ScenarioHook | null {
  const compatible = hooks.filter(
    (hook) =>
      !usedHookIds.has(hook.id) &&
      (!hook.compatibleFamilies?.length || hook.compatibleFamilies.includes(family.key)),
  );

  // Fallback prevents empty sessions when hook tags are sparse.
  const candidates = compatible.length > 0 ? compatible : hooks.filter((hook) => !usedHookIds.has(hook.id));

  return candidates[0] ?? null;
}

export function normalizeDifficulty(d?: string): QuestionFamily['difficulty'] | null {
  const map: Record<string, QuestionFamily['difficulty']> = {
    'warm up': 'warm_up',
    warm_up: 'warm_up',
    easy: 'warm_up',
    medium: 'medium',
    hard: 'hard',
    epic: 'epic',
  };
  return d ? map[d.toLowerCase()] ?? null : null;
}

function pickNextFamily(families: QuestionFamily[], state: SelectionState): QuestionFamily | null {
  // First pass: prefer unseen subtopics.
  const preferred = families.find((family) => {
    const subtopic = deriveSubtopic(family);
    return !state.usedFamilies.has(family.key) && !state.coveredSubtopics.has(subtopic);
  });
  if (preferred) {
    return acceptFamily(families, preferred, state);
  }

  for (let i = 0; i < families.length; i++) {
    const candidate = families[i];

    if (state.usedFamilies.has(candidate.key)) continue;

    const count = state.archetypeCounts.get(candidate.archetype) ?? 0;
    if (count >= state.maxPerArchetype) continue;

    return acceptFamily(families, candidate, state, i);
  }

  // Relax constraint: allow reusing families if we still need more.
  if (families.length > 0) {
    const fallback = families.shift()!;
    const count = state.archetypeCounts.get(fallback.archetype) ?? 0;
    state.archetypeCounts.set(fallback.archetype, count + 1);
    return fallback;
  }

  return null;
}

function acceptFamily(families: QuestionFamily[], family: QuestionFamily, state: SelectionState, index?: number) {
  const count = state.archetypeCounts.get(family.archetype) ?? 0;
  state.usedFamilies.add(family.key);
  state.archetypeCounts.set(family.archetype, count + 1);
  state.coveredSubtopics.add(deriveSubtopic(family));
  const idx = typeof index === 'number' ? index : families.indexOf(family);
  if (idx >= 0) families.splice(idx, 1);
  return family;
}

function deriveSubtopic(family: QuestionFamily) {
  return family.primaryConcepts?.[0] ?? family.key;
}
