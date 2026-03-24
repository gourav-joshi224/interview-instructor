export interface KeywordFamily {
  key: string;
  pattern: RegExp;
  maxRepeats?: number;
}

export interface FinalizeOptions {
  maxWords?: number;
  keywordFamilies?: KeywordFamily[];
}

const QUESTION_WORD_LIMIT = parseInt(process.env.QUESTION_WORD_LIMIT ?? '45', 10);
const DEFAULT_MAX_WORDS = QUESTION_WORD_LIMIT;

export const DEFAULT_KEYWORD_FAMILIES: KeywordFamily[] = [
  { key: 'event-loop', pattern: /\b(event loop|microtasks?|macrotasks?|timers?|rendering frames?)\b/gi, maxRepeats: 2 },
  { key: 'promises', pattern: /\b(promises?|async\/?await|microtasks?)\b/gi, maxRepeats: 2 },
  { key: 'memory', pattern: /\b(memory leaks?|heap|garbage collection|gc|retained objects?)\b/gi, maxRepeats: 2 },
];

export function finalizeQuestionText(raw: string, options: FinalizeOptions = {}): string {
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS;
  const keywordFamilies = options.keywordFamilies ?? DEFAULT_KEYWORD_FAMILIES;

  const fragments = splitFragments(raw);
  const deduped = dedupeFragments(fragments);

  let text = deduped.join(' ').replace(/\s+/g, ' ').trim();

  text = clampKeywordFamilies(text, keywordFamilies);

  if (countWords(text) > maxWords) {
    text = shrinkToWordLimit(deduped, maxWords);
  }

  return text;
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function splitFragments(raw: string): string[] {
  return raw
    .split(/(?<=[.?!])\s+|;\s+|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeFragment(fragment: string): string {
  return fragment.replace(/["'`]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
}

function dedupeFragments(fragments: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const fragment of fragments) {
    const norm = normalizeFragment(fragment);
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(fragment);
  }

  return result;
}

function clampKeywordFamilies(text: string, families: KeywordFamily[]): string {
  let output = text;

  for (const family of families) {
    const maxRepeats = family.maxRepeats ?? 2;
    let count = 0;
    output = output.replace(family.pattern, (match) => {
      count += 1;
      return count <= maxRepeats ? match : '';
    });
  }

  return output.replace(/\s{2,}/g, ' ').replace(/\s,/, ',').trim();
}

function shrinkToWordLimit(fragments: string[], maxWords: number): string {
  const kept: string[] = [];

  for (const fragment of fragments) {
    const candidate = [...kept, fragment].join(' ').trim();
    if (countWords(candidate) <= maxWords) {
      kept.push(fragment);
    } else {
      break;
    }
  }

  if (!kept.length && fragments.length) {
    const limited = fragments[0].split(/\s+/).slice(0, maxWords).join(' ');
    return limited.trim();
  }

  const joined = kept.join(' ').trim();
  if (countWords(joined) <= maxWords) return joined;

  const words = joined.split(/\s+/).slice(0, maxWords);
  return words.join(' ').trim();
}
