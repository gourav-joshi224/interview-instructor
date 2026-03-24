import { tokenizeNormalizedText } from './text-normalizer.util';

type GibberishSignal = 'repeated_word_spam' | 'keyboard_mash';

interface GibberishAssessment {
  isGibberish: boolean;
  signal: GibberishSignal | null;
}

const CONSECUTIVE_CONSONANTS_PATTERN = /[bcdfghjklmnpqrstvwxyz]{4,}/;

export const assessGibberish = (
  normalizedAnswer: string,
  hasTopicKeyword: boolean,
): GibberishAssessment => {
  const tokens = tokenizeNormalizedText(normalizedAnswer);

  if (tokens.length === 0) {
    return {
      isGibberish: false,
      signal: null,
    };
  }

  const tokenCounts = new Map<string, number>();
  for (const token of tokens) {
    const current = tokenCounts.get(token) ?? 0;
    tokenCounts.set(token, current + 1);
  }

  const maxRepeatedCount = Math.max(...tokenCounts.values());
  // >40% repeated ratio catches obvious single-word spam while avoiding normal emphasis.
  if (maxRepeatedCount / tokens.length > 0.4) {
    return {
      isGibberish: true,
      signal: 'repeated_word_spam',
    };
  }

  const keyboardMashLikeTokenCount = tokens.filter((token: string): boolean => {
    return CONSECUTIVE_CONSONANTS_PATTERN.test(token);
  }).length;

  // >60% mash-like tokens strongly indicates noise instead of language.
  const keyboardMashRatio = keyboardMashLikeTokenCount / tokens.length;
  // 4+ consonants is a robust keyboard-mash heuristic with low false positives.
  if (keyboardMashRatio > 0.6 && !hasTopicKeyword) {
    return {
      isGibberish: true,
      signal: 'keyboard_mash',
    };
  }

  return {
    isGibberish: false,
    signal: null,
  };
};
